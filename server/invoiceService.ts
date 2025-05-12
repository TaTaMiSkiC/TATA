import { db } from "./db";
import { 
  orders, 
  invoices, 
  invoiceItems, 
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  Order,
  orderItems as OrderItem
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface InvoiceGenerationOptions {
  language?: string;
}

export async function generateInvoiceFromOrder(
  orderId: number, 
  options: InvoiceGenerationOptions = {}
): Promise<number | null> {
  try {
    // Dohvati narudžbu
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));
    
    if (!order) {
      console.error(`Narudžba s ID: ${orderId} nije pronađena`);
      return null;
    }
    
    // Dohvati stavke narudžbe
    const orderItems = await db
      .select()
      .from(OrderItem)
      .where(eq(OrderItem.orderId, orderId));
    
    if (orderItems.length === 0) {
      console.error(`Narudžba s ID: ${orderId} nema stavki`);
      return null;
    }
    
    // Generiraj broj računa
    const year = new Date().getFullYear();
    const uniqueNumber = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `${year}-${uniqueNumber}`;
    
    // Pripremi podatke za račun
    const invoiceData = {
      invoiceNumber,
      orderId: order.id,
      userId: order.userId,
      customerName: `${order.firstName} ${order.lastName}`,
      customerEmail: order.email,
      customerAddress: order.address,
      customerCity: order.city,
      customerPostalCode: order.postalCode,
      customerCountry: order.country,
      customerPhone: order.phone,
      customerNote: order.note,
      total: order.total,
      subtotal: order.subtotal,
      tax: order.tax,
      paymentMethod: order.paymentMethod,
      language: options.language || order.language || "hr"
    };
    
    // Spremi račun u bazu
    const [invoice] = await db
      .insert(invoices)
      .values(invoiceData)
      .returning();
    
    // Spremi stavke računa
    for (const item of orderItems) {
      await db.insert(invoiceItems).values({
        invoiceId: invoice.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        selectedScent: item.scentName,
        selectedColor: item.colorName
      });
    }
    
    console.log(`Uspješno kreiran račun ${invoiceNumber} za narudžbu ${orderId}`);
    return invoice.id;
  } catch (error) {
    console.error("Greška kod generiranja računa:", error);
    return null;
  }
}