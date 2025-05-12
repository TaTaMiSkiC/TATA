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

// Funkcija za generiranje PDF-a točno prema predlošku iz priloženog primjera invoice-i450.pdf
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
        shipping: "Dostava",
        tax: "PDV (0%)",
        totalAmount: "UKUPNI IZNOS",
        paymentInfo: "Podaci o plaćanju",
        paymentMethod: "Način plaćanja",
        paymentStatus: "Status plaćanja",
        paid: "Plaćeno",
        unpaid: "Nije plaćeno",
        cash: "Gotovina",
        bank: "Bankovni prijenos",
        paypal: "PayPal",
        credit_card: "Kreditna kartica",
        thankYou: "Hvala na vašoj narudžbi",
        generatedNote: "Ovo je automatski generiran račun i važeći je bez potpisa i pečata",
        exemptionNote: "Poduzetnik nije u sustavu PDV-a, PDV nije obračunat sukladno odredbama Zakona o malom poduzetništvu",
        handInvoice: "Ručno izrađen račun",
        orderItems: "Stavke narudžbe"
      },
      en: {
        title: "INVOICE",
        date: "Invoice date",
        invoiceNo: "Invoice number",
        buyer: "Customer information",
        seller: "Seller",
        item: "Product",
        quantity: "Quantity",
        price: "Price/pc",
        total: "Total",
        subtotal: "Subtotal",
        shipping: "Shipping",
        tax: "VAT (0%)",
        totalAmount: "TOTAL AMOUNT",
        paymentInfo: "Payment information",
        paymentMethod: "Payment method",
        paymentStatus: "Payment status",
        paid: "Paid",
        unpaid: "Unpaid",
        cash: "Cash",
        bank: "Bank transfer",
        paypal: "PayPal",
        credit_card: "Credit card",
        thankYou: "Thank you for your order",
        generatedNote: "This is an automatically generated invoice and is valid without signature and stamp",
        exemptionNote: "The entrepreneur is not in the VAT system, VAT is not calculated according to the provisions of the Small Business Act",
        handInvoice: "Manually created invoice",
        orderItems: "Order items"
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
        shipping: "Versand",
        tax: "MwSt. (0%)",
        totalAmount: "GESAMTBETRAG",
        paymentInfo: "Zahlungsinformationen",
        paymentMethod: "Zahlungsmethode",
        paymentStatus: "Zahlungsstatus",
        paid: "Bezahlt",
        unpaid: "Unbezahlt",
        cash: "Bargeld",
        bank: "Banküberweisung",
        paypal: "PayPal",
        credit_card: "Kreditkarte",
        thankYou: "Vielen Dank für Ihre Bestellung",
        generatedNote: "Dies ist eine automatisch generierte Rechnung und ist ohne Unterschrift und Stempel gültig",
        exemptionNote: "Der Unternehmer ist nicht im Mehrwertsteuersystem, MwSt. wird nicht berechnet gemäß den Bestimmungen des Kleinunternehmerregelung",
        handInvoice: "Manuell erstellte Rechnung",
        orderItems: "Bestellpositionen"
      }
    };
    
    // Dohvaćanje prijevoda za odabrani jezik
    const t = translations[lang] || translations.hr;
    
    // Inicijalizacija PDF dokumenta - A4 format (210 x 297 mm)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    
    // Postavljanje fonta
    doc.setFont("helvetica", "normal");
    
    // Dodavanje loga tvrtke u zaglavlju
    try {
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', 20, 15, 30, 30);
      }
    } catch (error) {
      console.error("Greška pri dodavanju loga:", error);
    }
    
    // Naslov i podaci o tvrtki - točno prema predlošku PDF-a
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Kerzenwelt by Dani", 55, 25);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Ossiacher Zeile 30, 9500 Villach, Österreich", 55, 30);
    doc.text("Email: daniela.svoboda2@gmail.com", 55, 35);
    
    // Naslov dokumenta (RECHNUNG) - podebljani tekst na desnoj strani
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(t.title, 190, 25, { align: "right" });
    
    // Broj računa i datum
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${t.invoiceNo}: ${data.invoiceNumber}`, 190, 40, { align: "right" });
    
    // Format datuma (DD.MM.YYYY)
    const formattedDate = data.date ? format(new Date(data.date), "dd.MM.yyyy.") : format(new Date(), "dd.MM.yyyy.");
    doc.text(`${t.date}: ${formattedDate}`, 190, 45, { align: "right" });
    
    // Linija za razdvajanje zaglavlja od ostatka dokumenta
    doc.setDrawColor(0);
    doc.setLineWidth(0.1);
    doc.line(20, 50, 190, 50);
    
    // Podaci o kupcu
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${t.buyer}:`, 20, 60);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Kupac - podaci
    const buyer = data.buyer || {};
    let customerY = 67;
    
    // Podaci kupca
    if (buyer.fullName || (buyer.firstName && buyer.lastName)) {
      const fullName = buyer.fullName || `${buyer.firstName} ${buyer.lastName}`;
      doc.text(fullName, 20, customerY);
      customerY += 5;
    }
    
    if (buyer.email) {
      doc.text(`Email: ${buyer.email}`, 20, customerY);
      customerY += 5;
    }
    
    if (buyer.address) {
      const deliveryAddress = lang === 'hr' ? 'Adresa dostave:' : 
                           lang === 'en' ? 'Delivery address:' : 
                           'Lieferadresse:';
      doc.text(`${deliveryAddress} ${buyer.address}`, 20, customerY);
      customerY += 5;
    }
    
    if (buyer.zipCode || buyer.city) {
      const zipAndCity = `${buyer.zipCode || ""} ${buyer.city || ""}`.trim();
      if (zipAndCity) {
        doc.text(zipAndCity, 20, customerY);
        customerY += 5;
      }
    }
    
    if (buyer.country) {
      doc.text(buyer.country, 20, customerY);
      customerY += 5;
    }
    
    // Linija prije stavki narudžbe
    doc.line(20, customerY + 5, 190, customerY + 5);
    
    // Naslov za stavke narudžbe
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(t.orderItems + ":", 20, customerY + 15);
    
    // Linija iznad tablice
    doc.line(20, customerY + 20, 190, customerY + 20);
    
    // Koristimo autoTable za točno prikazivanje podataka kao u primjeru
    const tableStartY = customerY + 25;
    
    // Zaglavlje tablice
    const headers = [
      t.item,
      t.quantity,
      t.price, 
      t.total
    ];
    
    // Priprema podataka za tablicu
    const tableBody: any[] = [];
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item: any) => {
        const productName = item.productName || 'Proizvod';
        const quantity = item.quantity || 1;
        const price = item.price ? parseFloat(item.price).toFixed(2) + ' €' : '0.00 €';
        const total = (item.price * quantity).toFixed(2) + ' €';
        
        // Osnovni redak s proizvodom
        tableBody.push([productName, quantity, price, total]);
        
        // Dodatni redak za miris (ako postoji)
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
          
          tableBody.push([scentText, '', '', '']);
        }
        
        // Dodatni redak za boje (ako postoji)
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
          
          tableBody.push([colorText, '', '', '']);
        }
        
        // Prazan redak za razmak između stavki
        tableBody.push(['', '', '', '']);
      });
    } else {
      tableBody.push(["N/A - " + t.handInvoice, 1, "0.00 €", "0.00 €"]);
    }
    
    // Prikazujemo tablicu s točno definiranim stilovima
    autoTable(doc, {
      head: [headers],
      body: tableBody,
      startY: tableStartY,
      theme: 'plain',
      styles: {
        fontSize: 10,
        lineWidth: 0,
        cellPadding: 2,
      },
      headStyles: {
        fontStyle: 'bold',
        fillColor: [245, 245, 245],
        lineWidth: 0,
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { halign: 'center' as const },
        2: { halign: 'right' as const },
        3: { halign: 'right' as const }
      },
      margin: { top: 20, right: 20, bottom: 20, left: 20 }
    });
    
    // Dobivanje pozicije na kojoj je tablica završila
    // Dodamo sigurnosnu provjeru
    const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 50;
    
    // Sažetak s iznosima
    const summaryY = finalY + 10;
    
    // Linija iznad sažetka
    doc.line(120, summaryY, 190, summaryY);
    
    // Izračunavanje ukupnog iznosa
    const subtotal = data.items && Array.isArray(data.items)
      ? data.items.reduce((sum: number, item: any) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2)
      : "0.00";
      
    const tax = "0.00"; // PDV je 0% za male poduzetnike
    const shipping = data.shippingCost ? parseFloat(data.shippingCost).toFixed(2) : "0.00";
    const total = (parseFloat(subtotal) + parseFloat(shipping)).toFixed(2); 
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Međuzbroj i ostali iznosi
    doc.text(`${t.subtotal}:`, 150, summaryY + 7, { align: "right" });
    doc.text(`${subtotal} €`, 190, summaryY + 7, { align: "right" });
    
    doc.text(`${t.shipping}:`, 150, summaryY + 14, { align: "right" });
    doc.text(`${shipping} €`, 190, summaryY + 14, { align: "right" });
    
    doc.text(`${t.tax}:`, 150, summaryY + 21, { align: "right" });
    doc.text(`${tax} €`, 190, summaryY + 21, { align: "right" });
    
    // Linija iznad ukupnog iznosa
    doc.line(120, summaryY + 25, 190, summaryY + 25);
    
    // Ukupni iznos - podebljan
    doc.setFont("helvetica", "bold");
    doc.text(`${t.totalAmount}:`, 150, summaryY + 32, { align: "right" });
    doc.text(`${total} €`, 190, summaryY + 32, { align: "right" });
    
    // Linija ispod ukupnog iznosa
    doc.line(120, summaryY + 36, 190, summaryY + 36);
    
    // Informacije o plaćanju
    doc.setFontSize(11);
    doc.text(`${t.paymentInfo}:`, 20, summaryY + 50);
    
    // Linija ispod naslova
    doc.line(20, summaryY + 54, 190, summaryY + 54);
    
    // Detalji plaćanja
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const paymentMethodText = getPaymentMethodText(data.paymentMethod, lang, t);
    doc.text(`${t.paymentMethod}: ${paymentMethodText}`, 20, summaryY + 62);
    doc.text(`${t.paymentStatus}: ${t.paid}`, 20, summaryY + 69);
    
    // Zahvala - centrirana
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${t.thankYou}!`, 105, summaryY + 90, { align: "center" });
    
    // Podnožje
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    const footerText = "Kerzenwelt by Dani | Ossiacher Zeile 30, 9500 Villach, Österreich | Email: daniela.svoboda2@gmail.com | Telefon: 004366038787621";
    doc.text(footerText, 105, summaryY + 110, { align: "center" });
    
    // Napomena o automatskom generiranju
    doc.text(`${t.generatedNote}.`, 105, summaryY + 115, { align: "center" });
    
    // Steuernummer i napomena o PDV-u
    doc.text("Steuernummer: 61 154/7175", 105, summaryY + 120, { align: "center" });
    doc.text(t.exemptionNote, 105, summaryY + 125, { align: "center" });
    
    // Spremanje PDF-a
    doc.save(`${t.title.toLowerCase()}_${data.invoiceNumber}.pdf`);
    
    return true;
  } catch (error) {
    console.error("Greška pri generiranju PDF-a:", error);
    toast({
      variant: "destructive",
      title: "Greška",
      description: `Neuspjelo generiranje PDF-a: ${error instanceof Error ? error.message : String(error)}`
    });
    return false;
  }
};