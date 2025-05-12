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
    
    // Naslov i broj računa na desnoj strani - poravnato prema template-u
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
    
    // Podaci o kupcu - koristimo razmak od lijeve margine
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${t.buyer}:`, 20, 55);
    doc.setDrawColor(200, 200, 200);
    // Nema linije kao u templatu
    doc.setFont("helvetica", "normal");
    
    // Pomaknuti smo desno kao u templatu
    const customerIndent = 20;
    let customerY = 62;
    
    // Zaštitimo se od nedostajućih imena i prezimena
    const firstName = data.firstName || '';
    const lastName = data.lastName || '';
    doc.text(`${firstName} ${lastName}`.trim() || 'Kupac', customerIndent, customerY);
    customerY += 5;
    
    if (data.email) {
      doc.text(`Email: ${data.email}`, customerIndent, customerY);
      customerY += 5;
    }
    
    if (data.address) {
      doc.text(`${t.deliveryAddress}: ${data.address}`, customerIndent, customerY);
      customerY += 5;
      
      if (data.city && data.postalCode) {
        doc.text(`${data.postalCode} ${data.city}`, customerIndent, customerY);
        customerY += 5;
      }
      
      if (data.country) {
        doc.text(data.country, customerIndent, customerY);
        customerY += 5;
      }
    } else {
      doc.text(`${t.deliveryAddress}: N/A - ${t.handInvoice}`, customerIndent, customerY);
      customerY += 5;
    }
    
    // Dodajemo više prostora nakon podataka o kupcu
    customerY += 5;
    
    // Stavke narudžbe - dodajemo malo više razmaka nego u originalnoj metodi
    // kao u primjeru invoice-i451.pdf
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${t.orderItems}:`, 20, customerY + 5);
    
    // Priprema podataka za ručno crtanje tablice - pozicije prema priloženom templatu
    // Definicija pozicija za svaku kolonu - precizno usklađene s PDFom
    const columnPositions = {
      product: 30,  // Proizvod - uvučeno udесno
      quantity: 143, // Količina - centrirana daleko od proizvoda
      price: 165,    // Cijena - desno poravnata prije ukupno
      total: 190     // Ukupno - desno poravnato
    };
    
    // Razmak između zaglavlja tablice i podataka
    const startY = customerY + 15;
    
    // Iscrtavanje zaglavlja tablice - sve s dodatnim razmacima kao u PDF-u
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    
    // Postavimo zaglavlje s većim razmakom na vrhu, i bez linije na dnu
    doc.text(t.item, columnPositions.product, startY);
    doc.text(t.quantity, columnPositions.quantity, startY, { align: "center" });
    doc.text(t.price, columnPositions.price, startY, { align: "right" });
    doc.text(t.total, columnPositions.total, startY, { align: "right" });
    
    // Veći razmak nakon zaglavlja - u predlošku je vrlo velik razmak
    let currentY = startY + 20;
    
    // Ručno iscrtavanje svake stavke
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item: any) => {
        const productName = item.productName || '';
        const price = parseFloat(item.price).toFixed(2);
        const quantity = item.quantity;
        const total = (parseFloat(item.price) * quantity).toFixed(2);
        
        // Iscrtaj naziv proizvoda - uvučeno kao u template-u
        doc.setFont("helvetica", "normal");
        // Dodajemo 5px razmaka ispred naziva proizvoda da dobijemo uvlačenje kao u primjeru
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
        
        // Dodatni razmak nakon stavke - vrlo velik razmak kao u PDF predlošku
        currentY += 18;
        
        // Količina, cijena i ukupno se prikazuju na istoj visini kao naziv proizvoda
        // Pozicija je točno usklađena s primjerom - razlika je značajna
        
        // Pozicija cijene i količine menjana da odgovara predlošku
        // Ovu vrijednost sam precizno namjestio prema PDF-u
        const verticalPosition = currentY - 28;
        
        // Iscrtaj količinu, cijenu i ukupno za trenutnu stavku, poravnato kao u primjeru
        doc.text(quantity.toString(), columnPositions.quantity, verticalPosition, { align: "center" });
        doc.text(`${price} €`, columnPositions.price, verticalPosition, { align: "right" });
        doc.text(`${total} €`, columnPositions.total, verticalPosition, { align: "right" });
      });
    } else {
      doc.text("N/A - " + t.handInvoice, columnPositions.product, currentY);
      doc.text("1", columnPositions.quantity, currentY, { align: "center" });
      doc.text("0.00 €", columnPositions.price, currentY, { align: "right" });
      doc.text("0.00 €", columnPositions.total, currentY, { align: "right" });
      currentY += 10;
    }
    
    // Puno više prostora prije sažetka - u predlošku je vrlo veliki razmak
    currentY += 30;
    
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
    
    // Poravnanje desne kolone s vrijednostima - precizno namješteno kao u predlošku
    const valueX = 190;
    const labelX = 145; // Pomičem još više lijevo za predloška
    
    // Međuzbroj - s više razmaka
    doc.text(`${t.subtotal}:`, labelX, currentY, { align: "right" });
    doc.text(`${subtotal} €`, valueX, currentY, { align: "right" });
    
    // Dostava - više razmaka u predlošku
    doc.text(`${t.shipping}:`, labelX, currentY + 8, { align: "right" });
    doc.text(`${shipping} €`, valueX, currentY + 8, { align: "right" });
    
    // PDV (0%) - više razmaka u predlošku
    doc.text(`${t.tax}:`, labelX, currentY + 16, { align: "right" });
    doc.text(`0.00 €`, valueX, currentY + 16, { align: "right" });
    
    // Ukupan iznos - podebljan s dodatnim razmakom - još veći razmak
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    
    // Dodatni razmak prije totala - u predlošku je posebno velik razmak
    doc.text(`${t.totalAmount}:`, labelX, currentY + 26, { align: "right" });
    doc.text(`${total} €`, valueX, currentY + 26, { align: "right" });
    
    // Informacije o plaćanju - veliki razmak kao u predlošku
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${t.paymentInfo}:`, 20, currentY + 40); // Povećan razmak prije informacija o plaćanju
    // Nema linije u template-u 
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    // Prikaži odabrani način plaćanja
    const paymentMethodText = getPaymentMethodText(data.paymentMethod, lang, t);
    
    // Rzmak između naslova i podataka - povećan kao u predlošku
    doc.text(`${t.paymentMethod}: ${paymentMethodText}`, 20, currentY + 48);
    doc.text(`${t.paymentStatus}: ${t.paid}`, 20, currentY + 54);
    
    // Veći razmak prije zahvale - vrlo veliki razmak prema predlošku
    // Zahvala
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${t.thankYou}!`, 105, currentY + 85, { align: "center" });
    
    // Podnožje s kontakt informacijama - razmak je veći
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    // Velika margina prije podnožja kao u primjeru PDF-a
    const footerY = currentY + 100; 
    
    doc.text("Kerzenwelt by Dani | Ossiacher Zeile 30, 9500 Villach, Österreich | Email: daniela.svoboda2@gmail.com | Telefon: 004366038787621", 105, footerY, { align: "center" });
    
    // Napomena o automatskom generiranju - centrirana i manja
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