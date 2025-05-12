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

// Funkcija za generiranje PDF-a
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
        exemptionNote: "Der Unternehmer ist nicht im Mehrwertsteuersystem, MwSt. wird nicht berechnet gemäß den Bestimmungen des besonderen Besteuerungsverfahrens für kleine Steuerpflichtige.",
        orderItems: "Bestellpositionen",
        shipping: "Versand"
      }
    };
    
    // Odabir prijevoda
    const t = translations[lang] || translations.hr;
    
    const doc = new jsPDF();
    
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
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(t.title, 190, 24, { align: "right" });
    doc.setFontSize(11);
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
    
    // Stavke narudžbe
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${t.orderItems}:`, 20, customerY + 5);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, customerY + 7, 190, customerY + 7);
    
    // Priprema podataka za tablicu
    let items = [];
    
    if (data.items && Array.isArray(data.items)) {
      items = data.items.map((item: any) => {
        const itemName = item.productName || '';
        let details = '';
        
        if (item.scentName || item.selectedScent) {
          const scentName = item.scentName || item.selectedScent;
          if (lang === 'de') {
            details += `Duft: ${scentName}`;
          } else if (lang === 'en') {
            details += `Scent: ${scentName}`;
          } else {
            details += `Miris: ${scentName}`;
          }
        }
        
        if (item.colorName || item.selectedColor) {
          const colorName = item.colorName || item.selectedColor;
          if (details) details += ', ';
          
          if (lang === 'de') {
            details += `Farben: ${colorName}`;
          } else if (lang === 'en') {
            details += `Colors: ${colorName}`;
          } else {
            details += `Boje: ${colorName}`;
          }
        }
        
        const fullName = itemName + (details ? `\n${details}` : '');
        const price = parseFloat(item.price).toFixed(2);
        const total = (parseFloat(item.price) * item.quantity).toFixed(2);
        
        return [fullName, item.quantity, `${price} €`, `${total} €`];
      });
    } else {
      items = [
        ["N/A - " + t.handInvoice, 1, "0.00 €", "0.00 €"]
      ];
    }
    
    // Crtamo tablicu sa stavkama
    autoTable(doc, {
      startY: customerY + 10,
      head: [[t.item, t.quantity, t.price, t.total]],
      body: items,
      theme: 'plain',
      styles: {
        fontSize: 10,
        overflow: 'linebreak',
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
    });
    
    // Izračunavanje ukupnog iznosa
    const subtotal = data.items && Array.isArray(data.items)
      ? data.items.reduce((sum: number, item: any) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2)
      : "0.00";
      
    const tax = "0.00"; // PDV je 0% za male poduzetnike
    const shipping = data.shippingCost ? parseFloat(data.shippingCost).toFixed(2) : "5.00";
    const total = (parseFloat(subtotal) + parseFloat(shipping)).toFixed(2);
    
    // Dodavanje ukupnog iznosa
    // Ne možemo koristiti (doc as any).lastAutoTable jer koristimo autoTable iz biblioteke
    // Dobijemo finalY iz tablice koja je nacrtana
    const finalY = (doc as any)._previousAutoTable.finalY + 10;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Prikaz međuzbroja, dostave i ukupnog iznosa s desne strane
    doc.setFontSize(10);
    doc.text(`${t.subtotal}:`, 120, finalY);
    doc.text(`${subtotal} €`, 190, finalY, { align: "right" });
    
    // Dostava
    doc.text(`${t.shipping}:`, 120, finalY + 5);
    doc.text(`${shipping} €`, 190, finalY + 5, { align: "right" });
    
    // PDV (0%)
    doc.text(`${t.tax}:`, 120, finalY + 10);
    doc.text(`0.00 €`, 190, finalY + 10, { align: "right" });
    
    // Ukupan iznos - podebljan
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${t.totalAmount}:`, 120, finalY + 15);
    doc.text(`${total} €`, 190, finalY + 15, { align: "right" });
    
    // Informacije o plaćanju
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${t.paymentInfo}:`, 20, finalY + 25);
    doc.line(20, finalY + 27, 190, finalY + 27);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    // Prikaži odabrani način plaćanja
    const paymentMethodText = getPaymentMethodText(data.paymentMethod, lang, t);
    
    doc.text(`${t.paymentMethod}: ${paymentMethodText}`, 20, finalY + 32);
    doc.text(`${t.paymentStatus}: ${t.paid}`, 20, finalY + 37);
    
    // Zahvala
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${t.thankYou}!`, 105, finalY + 50, { align: "center" });
    
    // Podnožje s kontakt informacijama
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Kerzenwelt by Dani | Ossiacher Zeile 30, 9500 Villach, Österreich | Email: daniela.svoboda2@gmail.com | Telefon: 004366038787821", 105, finalY + 60, { align: "center" });
    
    // Napomena o automatskom generiranju
    doc.text(`${t.generatedNote}.`, 105, finalY + 65, { align: "center" });
    
    // Napomena o malim poreznim obveznicima
    if (lang === 'de') {
      doc.text("Dies ist eine automatisch generierte Rechnung und ist ohne Unterschrift und Stempel gültig", 105, finalY + 70, { align: "center" });
      doc.text("Steuernummer: 61 154/7175", 105, finalY + 75, { align: "center" });
    } else {
      doc.text("Steuernummer: 61 154/7175", 105, finalY + 70, { align: "center" });
      doc.text("Der Unternehmer ist nicht im Mehrwertsteuersystem.", 105, finalY + 75, { align: "center" });
    }
    
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