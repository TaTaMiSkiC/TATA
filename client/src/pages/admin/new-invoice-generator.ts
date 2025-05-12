import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import logoImg from "@assets/Kerzenwelt by Dani.png";

// Funkcija za prevođenje načina plaćanja
export const getPaymentMethodText = (method: string, lang: string, translations: any) => {
  const t = translations;
  
  if (!method) return lang === 'hr' ? 'Nije definirano' : lang === 'de' ? 'Nicht definiert' : 'Not defined';
  
  switch(method) {
    case 'cash': 
      return t.cash;
    case 'bank_transfer': 
      return t.bank;
    case 'paypal': 
      return t.paypal;
    case 'credit_card':
      return t.credit_card;
    default:
      // Za nepoznati tip, vrati formatiran tekst
      const formattedMethod = method
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      return formattedMethod;
  }
};

// Funkcija za generiranje PDF-a s identičnim izgledom kao u invoice-i451.pdf primjeru
export const generateInvoicePdf = (data: any, toast: any) => {
  try {
    console.log("Početak generiranja PDF-a, dobiveni podaci:", JSON.stringify(data, null, 2));
    
    // Određivanje jezika računa
    const lang = data.language || "hr";
    console.log("Korišteni jezik:", lang);
    
    // Definiranje prijevoda za PDF
    const translations: Record<string, Record<string, string>> = {
      hr: {
        title: "RAČUN",
        date: "Datum računa",
        invoiceNo: "Broj računa",
        buyer: "Podaci o kupcu",
        seller: "Prodavatelj",
        item: "Proizvod",
        quantity: "Količina",
        price: "Cijena/kom",
        total: "Ukupno",
        subtotal: "Međuzbroj",
        tax: "MwSt. (0%)",
        totalAmount: "GESAMTBETRAG",
        paymentInfo: "Informacije o plaćanju",
        paymentMethod: "Način plaćanja",
        paymentStatus: "Status plaćanja",
        cash: "Gotovina",
        bank: "Bankovni prijenos",
        paypal: "PayPal",
        credit_card: "Kreditna kartica",
        paid: "Plaćeno",
        unpaid: "U obradi",
        deliveryAddress: "Adresa za dostavu",
        handInvoice: "Ručni račun",
        thankYou: "Hvala Vam na narudžbi",
        generatedNote: "Ovo je automatski generirani račun i valjan je bez potpisa i pečata",
        exemptionNote: "Poduzetnik nije u sustavu PDV-a, PDV nije obračunat temeljem odredbi posebnog postupka oporezivanja za male porezne obveznike.",
        orderItems: "Stavke narudžbe",
        shipping: "Dostava"
      },
      en: {
        title: "INVOICE",
        date: "Invoice date",
        invoiceNo: "Invoice number",
        buyer: "Buyer information",
        seller: "Seller",
        item: "Product",
        quantity: "Quantity",
        price: "Price/unit",
        total: "Total",
        subtotal: "Subtotal",
        tax: "MwSt. (0%)",
        totalAmount: "TOTAL",
        paymentInfo: "Payment information",
        paymentMethod: "Payment method",
        paymentStatus: "Payment status",
        cash: "Cash",
        bank: "Bank transfer",
        paypal: "PayPal",
        credit_card: "Credit card",
        paid: "Paid",
        unpaid: "Processing",
        deliveryAddress: "Delivery address",
        handInvoice: "Hand invoice",
        thankYou: "Thank you for your order",
        generatedNote: "This is an automatically generated invoice and is valid without signature or stamp",
        exemptionNote: "The entrepreneur is not in the VAT system, VAT is not calculated based on the provisions of the special taxation procedure for small taxpayers.",
        orderItems: "Order items",
        shipping: "Shipping"
      },
      de: {
        title: "RECHNUNG",
        date: "Rechnungsdatum",
        invoiceNo: "Rechnungsnummer",
        buyer: "Käuferinformationen",
        seller: "Verkäufer",
        item: "Produkt",
        quantity: "Menge",
        price: "Preis/Stück",
        total: "Gesamt",
        subtotal: "Zwischensumme",
        tax: "MwSt. (0%)",
        totalAmount: "GESAMTBETRAG",
        paymentInfo: "Zahlungsinformationen",
        paymentMethod: "Zahlungsmethode",
        paymentStatus: "Zahlungsstatus",
        cash: "Barzahlung",
        bank: "Banküberweisung",
        paypal: "PayPal",
        credit_card: "Kreditkarte",
        paid: "Bezahlt",
        unpaid: "In Bearbeitung",
        deliveryAddress: "Lieferadresse",
        handInvoice: "Handrechnung",
        thankYou: "Vielen Dank für Ihre Bestellung",
        generatedNote: "Dies ist eine automatisch generierte Rechnung und ist ohne Unterschrift und Stempel gültig",
        exemptionNote: "Der Unternehmer ist nicht im Mehrwertsteuersystem, MwSt. wird nicht berechnet gemäß den Bestimmungen des Kleinunternehmerregelung.",
        orderItems: "Bestellpositionen",
        shipping: "Versand"
      }
    };
    
    // Odabir prijevoda
    const t = translations[lang] || translations.hr;
    
    // Proširujemo jsPDF s lastAutoTable interfejsom
    interface ExtendedJsPDF extends jsPDF {
      lastAutoTable?: {
        finalY: number;
      };
    }
    
    const doc = new jsPDF() as ExtendedJsPDF;
    
    // Postavljanje osnovnih detalja
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Gornji dio - Logo s lijeve strane i naslov na desnoj
    try {
      // Dodajemo logo ako je dostupan
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', 20, 15, 30, 30);
      } else {
        console.log("Logo nije dostupan, preskačem dodavanje.");
      }
    } catch (error) {
      console.error("Pogreška pri učitavanju loga:", error);
    }
    
    doc.setTextColor(218, 165, 32); // Zlatna boja (RGB)
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Kerzenwelt by Dani", 55, 24);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Vraćanje na crnu boju
    doc.setFont("helvetica", "normal");
    doc.text("Ossiacher Zeile 30, 9500 Villach, Österreich", 55, 30);
    doc.text("Email: daniela.svoboda2@gmail.com", 55, 35);
    
    // Naslov i broj računa na desnoj strani
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(t.title, 190, 24, { align: "right" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${t.invoiceNo}: ${data.invoiceNumber}`, 190, 32, { align: "right" });
    doc.text(`${t.date}: ${format(new Date(data.createdAt || new Date()), "dd.MM.yyyy.")}`, 190, 38, { align: "right" });
    
    // Horizontalna linija
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 45, 190, 45);
    
    // Podaci o kupcu
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${t.buyer}:`, 20, 55);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 57, 190, 57);
    doc.setFont("helvetica", "normal");
    
    let customerY = 62;
    
    // Zaštitimo se od nedostajućih imena i prezimena
    const firstName = data.firstName || '';
    const lastName = data.lastName || '';
    doc.text(`${firstName} ${lastName}`.trim() || 'Kupac', 20, customerY);
    customerY += 5;
    
    if (data.email) {
      doc.text(`Email: ${data.email}`, 20, customerY);
      customerY += 5;
    }
    
    if (data.address) {
      doc.text(`${t.deliveryAddress}: ${data.address}`, 20, customerY);
      customerY += 5;
      
      if (data.city && data.postalCode) {
        doc.text(`${data.postalCode} ${data.city}`, 20, customerY);
        customerY += 5;
      }
      
      if (data.country) {
        doc.text(data.country, 20, customerY);
        customerY += 5;
      }
    } else {
      doc.text(`${t.deliveryAddress}: N/A - ${t.handInvoice}`, 20, customerY);
      customerY += 5;
    }
    
    // Dodajemo više prostora nakon podataka o kupcu
    customerY += 5;
    
    // Stavke narudžbe - dodajemo malo više razmaka nego u originalnoj metodi
    // kao u primjeru invoice-i451.pdf
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${t.orderItems}:`, 20, customerY + 5);
    
    // Priprema podataka za ručno crtanje tablice
    // Definicija pozicija za svaku kolonu - prilagođeno točno kao u primjeru
    const columnPositions = {
      product: 20,  // Proizvod
      quantity: 140, // Količina - dalje od proizvoda za više prostora
      price: 160,    // Cijena - prilagođeno za više prostora
      total: 190     // Ukupno - desno poravnato
    };
    
    // Razmak između zaglavlja tablice i podataka
    const startY = customerY + 15;
    
    // Iscrtavanje zaglavlja tablice
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(t.item, columnPositions.product, startY);
    doc.text(t.quantity, columnPositions.quantity, startY, { align: "center" });
    doc.text(t.price, columnPositions.price, startY, { align: "right" });
    doc.text(t.total, columnPositions.total, startY, { align: "right" });
    
    // Dodajemo dodatni razmak za zaglavlje
    // Samo koristimo više prostora
    
    // Dodatan prostor nakon zaglavlja
    let currentY = startY + 10;
    
    // Ručno iscrtavanje svake stavke
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item: any) => {
        const productName = item.productName || '';
        const price = parseFloat(item.price).toFixed(2);
        const quantity = item.quantity;
        const total = (parseFloat(item.price) * quantity).toFixed(2);
        
        // Iscrtaj naziv proizvoda
        doc.setFont("helvetica", "normal");
        doc.text(productName, columnPositions.product, currentY);
        currentY += 6; // Veći razmak nakon naziva proizvoda
        
        // Opcija "Duft:" za miris
        if (item.scentName || item.selectedScent) {
          const scentName = item.scentName || item.selectedScent;
          let scentText = '';
          
          if (lang === 'de') {
            scentText = `Duft: ${scentName}`;
          } else if (lang === 'en') {
            scentText = `Scent: ${scentName}`;
          } else {
            scentText = `Miris: ${scentName}`;
          }
          
          doc.text(scentText, columnPositions.product, currentY);
          currentY += 6; // Veći razmak nakon mirisa
        }
        
        // Opcija "Farben:" za boje
        if (item.colorName || item.selectedColor) {
          const colorName = item.colorName || item.selectedColor;
          let colorText = '';
          
          if (lang === 'de') {
            colorText = `Farben: ${colorName}`;
          } else if (lang === 'en') {
            colorText = `Colors: ${colorName}`;
          } else {
            colorText = `Boje: ${colorName}`;
          }
          
          doc.text(colorText, columnPositions.product, currentY);
          currentY += 6; // Veći razmak nakon boja
        }
        
        // Dodatni razmak nakon stavke
        currentY += 8;
        
        // Za količinu, cijenu i ukupno koristimo vertikalnu sredinu stavke
        const verticalCenter = currentY - 15; // Sredina stavke za druge stupce
        
        // Iscrtaj količinu, cijenu i ukupno za trenutnu stavku, poravnato desno
        doc.text(quantity.toString(), columnPositions.quantity, verticalCenter, { align: "center" });
        doc.text(`${price} €`, columnPositions.price, verticalCenter, { align: "right" });
        doc.text(`${total} €`, columnPositions.total, verticalCenter, { align: "right" });
      });
    } else {
      doc.text("N/A - " + t.handInvoice, columnPositions.product, currentY);
      doc.text("1", columnPositions.quantity, currentY, { align: "center" });
      doc.text("0.00 €", columnPositions.price, currentY, { align: "right" });
      doc.text("0.00 €", columnPositions.total, currentY, { align: "right" });
      currentY += 10;
    }
    
    // Dodajemo razmak nakon tablice za sažetak
    currentY += 20;
    
    console.log("Pozicija nakon tablice:", currentY);
    
    // Izračunavanje ukupnog iznosa
    const subtotal = data.items && Array.isArray(data.items)
      ? data.items.reduce((sum: number, item: any) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2)
      : "0.00";
      
    const tax = "0.00"; // PDV je 0% za male poduzetnike
    const shipping = data.shippingCost ? parseFloat(data.shippingCost).toFixed(2) : "5.00";
    const total = (parseFloat(subtotal) + parseFloat(shipping)).toFixed(2); 
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Poravnanje desne kolone s vrijednostima
    const valueX = 190;
    const labelX = 170; // Više desno za kraće labele kao u primjeru
    
    // Međuzbroj - s više razmaka
    doc.text(`${t.subtotal}:`, labelX, currentY, { align: "right" });
    doc.text(`${subtotal} €`, valueX, currentY, { align: "right" });
    
    // Dostava
    doc.text(`${t.shipping}:`, labelX, currentY + 6, { align: "right" });
    doc.text(`${shipping} €`, valueX, currentY + 6, { align: "right" });
    
    // PDV (0%)
    doc.text(`${t.tax}:`, labelX, currentY + 12, { align: "right" });
    doc.text(`0.00 €`, valueX, currentY + 12, { align: "right" });
    
    // Ukupan iznos - podebljan s dodatnim razmakom
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    
    // Dodatni razmak prije totala
    doc.text(`${t.totalAmount}:`, labelX, currentY + 20, { align: "right" });
    doc.text(`${total} €`, valueX, currentY + 20, { align: "right" });
    
    // Informacije o plaćanju
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${t.paymentInfo}:`, 20, currentY + 25);
    doc.line(20, currentY + 27, 190, currentY + 27);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    // Prikaži odabrani način plaćanja
    const paymentMethodText = getPaymentMethodText(data.paymentMethod, lang, t);
    
    doc.text(`${t.paymentMethod}: ${paymentMethodText}`, 20, currentY + 32);
    doc.text(`${t.paymentStatus}: ${t.paid}`, 20, currentY + 37);
    
    // Veći razmak prije zahvale
    // Zahvala
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${t.thankYou}!`, 105, currentY + 60, { align: "center" });
    
    // Podnožje s kontakt informacijama - razmak je veći
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    const footerY = currentY + 75; // Početna pozicija podnožja
    
    doc.text("Kerzenwelt by Dani | Ossiacher Zeile 30, 9500 Villach, Österreich | Email: daniela.svoboda2@gmail.com | Telefon: 004366038787621", 105, footerY, { align: "center" });
    
    // Napomena o automatskom generiranju
    doc.text(`${t.generatedNote}.`, 105, footerY + 5, { align: "center" });
    
    // Napomena o malim poreznim obveznicima
    doc.text("Steuernummer: 61 154/7175", 105, footerY + 10, { align: "center" });
    doc.text(t.exemptionNote, 105, footerY + 15, { align: "center" });
    
    // Spremanje PDF-a
    doc.save(`${t.title.toLowerCase()}_${data.invoiceNumber}.pdf`);
  } catch (error) {
    console.error("Greška pri generiranju PDF-a:", error);
    console.log("Stack trace:", error instanceof Error ? error.stack : 'Nema stack trace-a');
    
    toast({
      title: "Greška",
      description: "Došlo je do pogreške pri generiranju PDF računa.",
      variant: "destructive",
    });
  }
};