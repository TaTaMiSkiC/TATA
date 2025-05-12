import { db } from "./db";
import { storage } from "./storage";
import { 
  orders, 
  invoices, 
  invoiceItems,
  users
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface InvoiceGenerationOptions {
  language?: string;
}

/**
 * Generira račun za navedenu narudžbu
 * @param orderId ID narudžbe za koju se generira račun
 * @param options Dodatne opcije (jezik itd.)
 * @returns ID kreiranog računa ili null u slučaju greške
 */
export async function generateInvoiceFromOrder(
  orderId: number, 
  options: InvoiceGenerationOptions = {}
): Promise<number | null> {
  try {
    console.log(`Pokretanje generiranja računa za narudžbu ${orderId}...`);
    
    // Dohvati narudžbu
    const order = await storage.getOrder(orderId);
    
    if (!order) {
      console.error(`Narudžba s ID: ${orderId} nije pronađena`);
      return null;
    }
    
    // Dohvati korisnika
    const user = await storage.getUser(order.userId);
    
    if (!user) {
      console.error(`Korisnik s ID: ${order.userId} nije pronađen`);
      return null;
    }
    
    // Dohvati stavke narudžbe s proizvod detaljima
    const orderItems = await storage.getOrderItems(orderId);
    
    if (orderItems.length === 0) {
      console.error(`Narudžba s ID: ${orderId} nema stavki`);
      return null;
    }
    
    // Provjeri postoji li već račun za ovu narudžbu
    const existingInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.orderId, orderId));
    
    if (existingInvoices.length > 0) {
      console.log(`Račun za narudžbu ${orderId} već postoji (ID: ${existingInvoices[0].id})`);
      return existingInvoices[0].id;
    }
    
    // Generiraj broj računa
    const year = new Date().getFullYear();
    const uniqueNumber = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `${year}-${uniqueNumber}`;
    
    // Pripremi podatke za račun
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    
    const invoiceData = {
      invoiceNumber,
      orderId: order.id,
      userId: order.userId,
      customerName: fullName,
      customerEmail: user.email,
      customerAddress: order.shippingAddress,
      customerCity: order.shippingCity,
      customerPostalCode: order.shippingPostalCode,
      customerCountry: order.shippingCountry,
      customerPhone: order.shippingPhone,
      customerNote: order.customerNote,
      total: order.total,
      subtotal: order.subtotal || "0.00",
      tax: "0.00", // Austrija nema PDV za male poduzetnike
      paymentMethod: order.paymentMethod,
      language: options.language || order.language || "hr"
    };
    
    console.log("Kreiranje računa s podacima:", invoiceData);
    
    // Spremi račun u bazu
    const [invoice] = await db
      .insert(invoices)
      .values(invoiceData)
      .returning();
    
    console.log(`Kreiran račun ${invoice.invoiceNumber} (ID: ${invoice.id})`);
    
    // Spremi stavke računa
    console.log("Sve stavke narudžbe za unos u račun:", JSON.stringify(orderItems, null, 2));
    
    for (const item of orderItems) {
      try {
        const invoiceItem = {
          invoiceId: invoice.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          selectedScent: item.scentName || null,
          selectedColor: item.colorName || null
        };
        
        console.log("Dodajem stavku računa:", JSON.stringify(invoiceItem, null, 2));
        
        await db.insert(invoiceItems).values([invoiceItem]);
        console.log(`Uspješno dodana stavka računa: ${item.productName}, količina: ${item.quantity}`);
      } catch (itemError) {
        console.error(`Greška pri dodavanju stavke (${item.productName}) računa:`, itemError);
      }
    }
    
    console.log(`Uspješno kreiran račun ${invoiceNumber} za narudžbu ${orderId}`);
    return invoice.id;
  } catch (error) {
    console.error("Greška kod generiranja računa:", error);
    return null;
  }
}