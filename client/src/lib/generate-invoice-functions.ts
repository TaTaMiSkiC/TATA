// Ovdje definiramo izvozne funkcije koje će se koristiti u order-details-page.tsx za generiranje faktura

import { format } from "date-fns";
import { generateInvoicePdf } from "./generate-invoice-pdf";
import { OrderWithItems } from "@shared/schema";

export function prepareInvoiceDataFromOrder(
  orderWithItems: OrderWithItems, 
  orderItems: any[], 
  user: any, 
  language: string
) {
  // Pripremi podatke za zajedničku funkciju za generiranje PDF-a
  const invoiceItems = orderItems.map(item => {
    return {
      id: item.id,
      productName: item.productName || (item.product && item.product.name) || `Proizvod #${item.productId}`,
      quantity: item.quantity,
      price: item.price,
      selectedScent: item.scentName,
      selectedColor: item.colorName,
      hasMultipleColors: item.hasMultipleColors
    };
  });
  
  // Dobivanje broja računa iz baze ili generiranje privremenog ako ne postoji
  let invoiceNumber = '';
  
  // Ako postoji faktura u bazi, koristi njen broj
  if (orderWithItems.invoice && orderWithItems.invoice.invoiceNumber) {
    invoiceNumber = orderWithItems.invoice.invoiceNumber;
    console.log("Korištenje stvarnog broja računa iz baze:", invoiceNumber);
  } else {
    // Ako nema fakture, koristimo privremeni format s ID-om narudžbe
    const baseNumber = 450;
    invoiceNumber = orderWithItems.id < baseNumber ? `i${baseNumber}` : `i${orderWithItems.id}`;
    console.log("Korištenje privremenog broja računa:", invoiceNumber);
  }
  
  // Pripremi podatke za PDF
  const invoiceData = {
    invoiceNumber: invoiceNumber,
    createdAt: format(new Date(orderWithItems.createdAt), 'yyyy-MM-dd'),
    firstName: user.firstName || (user.name?.split(' ')[0]) || user.username || 'Korisnik',
    lastName: user.lastName || (user.name?.split(' ').slice(1).join(' ')) || '',
    address: orderWithItems.shippingAddress || user.address || '',
    city: orderWithItems.shippingCity || user.city || '',
    postalCode: orderWithItems.shippingPostalCode || user.postalCode || '',
    country: orderWithItems.shippingCountry || user.country || '',
    email: user.email || '',
    phone: orderWithItems.shippingPhone || '',
    customerNote: orderWithItems.customerNote || '',
    items: invoiceItems,
    language: language,
    paymentMethod: orderWithItems.paymentMethod || 'cash'
  };
  
  return invoiceData;
}

export function generateOrderInvoice(invoiceData: any) {
  generateInvoicePdf(invoiceData);
}
