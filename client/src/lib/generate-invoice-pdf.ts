import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImg from "@assets/Kerzenwelt by Dani.png";

// Tip podataka za stavke računa
interface InvoiceItem {
  id: number;
  productName: string;
  quantity: number;
  price: string;
  selectedScent?: string;
  selectedColor?: string;
  hasMultipleColors?: boolean;
}

// Tip podataka za račun
interface InvoiceData {
  invoiceNumber: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
  customerNote?: string;
  items: InvoiceItem[];
  language: string;
  paymentMethod: string;
}

export function getPaymentMethodText(method: string, language: string): string {
  const translations: Record<string, Record<string, string>> = {
    hr: {
      cash: "Gotovina",
      bank_transfer: "Bankovni prijenos",
      paypal: "PayPal",
      credit_card: "Kreditna kartica"
    },
    en: {
      cash: "Cash",
      bank_transfer: "Bank transfer",
      paypal: "PayPal",
      credit_card: "Credit card"
    },
    de: {
      cash: "Bargeld",
      bank_transfer: "Banküberweisung",
      paypal: "PayPal",
      credit_card: "Kreditkarte"
    }
  };

  const lang = language in translations ? language : "hr";
  return translations[lang][method] || method;
}

export function generateInvoicePdf(invoiceData: InvoiceData): void {
  try {
    // Log podataka za debugging
    console.log("Početak generiranja PDF-a, dobiveni podaci:", JSON.stringify(invoiceData, null, 2));
    
    // Korišteni jezik za prijevode
    const lang = invoiceData.language || "hr";
    console.log("Korišteni jezik:", lang);
    
    // Definiranje prijevoda za PDF
    const translations: Record<string, Record<string, string>> = {
      hr: {
        title: "RACUN",
        date: "Datum racuna",
        invoiceNo: "Broj racuna",
        buyer: "Podaci o kupcu",
        seller: "Prodavatelj",
        item: "Proizvod",
        quantity: "Kolicina",
        price: "Cijena/kom",
        total: "Ukupno",
        subtotal: "Meduzboj",
        tax: "PDV (0%)",
        totalAmount: "UKUPNO",
        paymentInfo: "Informacije o placanju",
        paymentMethod: "Nacin placanja",
        paymentStatus: "Status placanja",
        cash: "Gotovina",
        bank: "Bankovni prijenos",
        paypal: "PayPal",
        paid: "Placeno",
        unpaid: "U obradi",
        deliveryAddress: "Adresa za dostavu",
        handInvoice: "Rucni racun",
        thankYou: "Hvala Vam na narudzbi",
        generatedNote: "Ovo je automatski generirani racun i valjan je bez potpisa i pecata",
        exemptionNote: "Poduzetnik nije u sustavu PDV-a, PDV nije obracunat temeljem odredbi posebnog postupka oporezivanja za male porezne obveznike.",
        orderItems: "Stavke narudzbe",
        shipping: "Dostava",
        customerNote: "Napomena kupca"
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
        tax: "VAT (0%)",
        totalAmount: "TOTAL",
        paymentInfo: "Payment information",
        paymentMethod: "Payment method",
        paymentStatus: "Payment status",
        cash: "Cash",
        bank: "Bank transfer",
        paypal: "PayPal",
        paid: "Paid",
        unpaid: "Processing",
        deliveryAddress: "Delivery address",
        handInvoice: "Hand invoice",
        thankYou: "Thank you for your order",
        generatedNote: "This is an automatically generated invoice and is valid without signature and stamp",
        exemptionNote: "Entrepreneur is not in the VAT system, VAT is not calculated based on the provisions of the special taxation procedure for small taxpayers.",
        orderItems: "Order items",
        shipping: "Shipping",
        customerNote: "Customer note"
      },
      de: {
        title: "RECHNUNG",
        date: "Rechnungsdatum",
        invoiceNo: "Rechnungsnummer",
        buyer: "Käuferinformationen",
        seller: "Verkäufer",
        item: "Produkt",
        quantity: "Menge",
        price: "Preis/Einheit",
        total: "Gesamt",
        subtotal: "Zwischensumme",
        tax: "MwSt. (0%)",
        totalAmount: "GESAMTBETRAG",
        paymentInfo: "Zahlungsinformationen",
        paymentMethod: "Zahlungsmethode",
        paymentStatus: "Zahlungsstatus",
        cash: "Bargeld",
        bank: "Banküberweisung",
        paypal: "PayPal",
        paid: "Bezahlt",
        unpaid: "In Bearbeitung",
        deliveryAddress: "Lieferadresse",
        handInvoice: "Handrechnung",
        thankYou: "Vielen Dank für Ihre Bestellung",
        generatedNote: "Dies ist eine automatisch erstellte Rechnung und ist ohne Unterschrift und Stempel gültig",
        exemptionNote: "Unternehmer ist nicht im Mehrwertsteuersystem, die Mehrwertsteuer wird nicht auf Grundlage der Bestimmungen des besonderen Besteuerungsverfahrens für Kleinunternehmer berechnet.",
        orderItems: "Bestellpositionen",
        shipping: "Versand",
        customerNote: "Kundennotiz"
      }
    };
    
    // Dohvati prijevode za odabrani jezik
    const t = translations[lang] || translations["hr"];
    
    // Inicijalizacija PDF dokumenta
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    
    // Dodavanje slike loga
    try {
      doc.addImage(logoImg, "PNG", 20, 15, 30, 30);
    } catch (e) {
      console.error("Greška kod dodavanja slike:", e);
    }
    
    // Formatiranje datuma
    const orderDate = new Date(invoiceData.createdAt);
    const formattedDate = orderDate.toLocaleDateString(lang === "hr" ? "hr-HR" : lang === "de" ? "de-DE" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    
    // Broj računa
    const invoiceNumber = invoiceData.invoiceNumber;
    
    // Dodavanje naslova i informacija o računu
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
    doc.text(`${t.invoiceNo}: ${invoiceNumber}`, 190, 32, { align: "right" });
    doc.text(`${t.date}: ${formattedDate}`, 190, 38, { align: "right" });
    
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
    
    // Dodajemo informacije o kupcu
    const fullName = `${invoiceData.firstName || ''} ${invoiceData.lastName || ''}`.trim();
    const email = invoiceData.email || '';
    const address = invoiceData.address || '';
    const city = invoiceData.city || '';
    const postalCode = invoiceData.postalCode || '';
    const country = invoiceData.country || '';
    const phone = invoiceData.phone || '';
    
    doc.text(fullName, 20, customerY);
    customerY += 6;
    
    // Adresa korisnika
    if (address) {
      doc.text(address, 20, customerY);
      customerY += 6;
    }
    
    // Grad i poštanski broj
    if (city || postalCode) {
      doc.text(`${postalCode} ${city}`.trim(), 20, customerY);
      customerY += 6;
    }
    
    // Država
    if (country) {
      doc.text(country, 20, customerY);
      customerY += 6;
    }
    
    // Email
    if (email) {
      doc.text(`Email: ${email}`, 20, customerY);
      customerY += 6;
    }
    
    // Telefon
    if (phone) {
      doc.text(`Tel: ${phone}`, 20, customerY);
      customerY += 6;
    }
    
    // Napomena kupca ako postoji
    if (invoiceData.customerNote) {
      doc.text(`${t.customerNote}: ${invoiceData.customerNote}`, 20, customerY);
      customerY += 6;
    }
    
    // Dodavanje prodavatelja na desnoj strani
    doc.setFont("helvetica", "bold");
    doc.text(`${t.seller}:`, 120, 55);
    doc.setFont("helvetica", "normal");
    doc.text("Kerzenwelt by Dani", 120, 62);
    doc.text("Ossiacher Zeile 30", 120, 68);
    doc.text("9500 Villach", 120, 74);
    doc.text("Österreich", 120, 80);
    doc.text("Steuernummer: 61 154/7175", 120, 86);
    
    // Priprema stavki za tablicu
    let items: any[][] = [];
    if (invoiceData.items && invoiceData.items.length > 0) {
      items = invoiceData.items.map((item) => {
        // Naziv proizvoda i detalji
        const productName = item.productName;
        const details: string[] = [];
      
        // Dodaj miris ako postoji
        if (item.selectedScent) {
          // Koristi prijevod za riječ "Miris"
          const scentText = lang === 'hr' ? 'Miris' : lang === 'de' ? 'Duft' : 'Scent';
          details.push(`${scentText}: ${item.selectedScent}`);
        }
        
        // Dodaj boju/boje
        if (item.selectedColor) {
          // Koristi prijevod za riječ "Boja" ili "Boje"
          const colorSingular = lang === 'hr' ? 'Boja' : lang === 'de' ? 'Farbe' : 'Color';
          const colorPlural = lang === 'hr' ? 'Boje' : lang === 'de' ? 'Farben' : 'Colors';
          const colorPrefix = item.hasMultipleColors ? colorPlural : colorSingular;
          details.push(`${colorPrefix}: ${item.selectedColor}`);
        }
        
        // Spoji naziv proizvoda s detaljima
        const detailsText = details.length > 0 ? `\n${details.join('\n')}` : '';
        const fullName = `${productName}${detailsText}`;
        const price = parseFloat(item.price).toFixed(2);
        const total = (parseFloat(item.price) * item.quantity).toFixed(2);
        
        return [fullName, item.quantity, `${price} €`, `${total} €`];
      });
    } else {
      // Dodajemo ručno barem jednu stavku ako nema podataka
      items = [["Proizvod nije specificiran", 1, "0.00 €", "0.00 €"]];
    }
    
    // Dodavanje tablice
    autoTable(doc, {
      head: [[
        t.item, 
        t.quantity.replace(/\s+/g, ' '), // Osigurajmo da nema višestrukih razmaka
        t.price, 
        t.total
      ]],
      body: items,
      startY: customerY + 10,
      margin: { left: 20, right: 20 },
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'left',
        valign: 'middle',
        fontSize: 10,
        cellPadding: 5,
        minCellWidth: 30, // Osigurajmo da ćelije zaglavlja budu dovoljno široke
        overflow: 'visible', // Osigurajmo da tekst ne bude prekinut
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        fontSize: 10,
        cellPadding: 5,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
      },
      didDrawPage: (data) => {
        // Dodavanje dodatnih elemenata na svakoj stranici
      }
    });
    
    // Dobivamo poziciju nakon tablice
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    console.log("Pozicija nakon tablice:", finalY);
    
    // Izračunavanje ukupnog iznosa
    const itemsTotal = invoiceData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);
    const shipping = 5.00; // Standardna cijena dostave
    const totalAmount = itemsTotal + shipping;
    
    // Dodavanje podataka o ukupnom iznosu
    const totalTableBody = [
      [t.subtotal, `${itemsTotal.toFixed(2)} €`],
      [t.shipping, `${shipping.toFixed(2)} €`],
      [t.tax, "0.00 €"],
      [t.totalAmount, `${totalAmount.toFixed(2)} €`]
    ];
    
    autoTable(doc, {
      body: totalTableBody,
      startY: finalY + 10,
      margin: { left: 100, right: 20 },
      theme: 'plain',
      tableWidth: 90,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { halign: 'right', cellWidth: 30 },
      },
      didParseCell: function(data) {
        // Podebljanje zadnjeg reda (ukupno)
        if(data.row.index === 3) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
    
    // Podaci o plaćanju
    let paymentY = (doc as any).lastAutoTable.finalY + 15 || finalY + 50;
    
    doc.setFont("helvetica", "bold");
    doc.text(t.paymentInfo, 20, paymentY);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, paymentY + 2, 190, paymentY + 2);
    
    // Način plaćanja
    doc.setFont("helvetica", "normal");
    paymentY += 10;
    const paymentMethodText = getPaymentMethodText(invoiceData.paymentMethod, lang);
    doc.text(`${t.paymentMethod}: ${paymentMethodText}`, 20, paymentY);
    
    // Bankovni podaci
    if (invoiceData.paymentMethod === 'bank_transfer') {
      paymentY += 6;
      doc.text("Bank: Österreichische Postsparkasse AG", 20, paymentY);
      paymentY += 6;
      doc.text("IBAN: AT39 6000 0102 1019 6916", 20, paymentY);
      paymentY += 6;
      doc.text("BIC: BAWAATWW", 20, paymentY);
    }
    
    // Napomene na dnu
    const noteY = Math.max(paymentY + 20, doc.internal.pageSize.height - 40);
    
    doc.setFontSize(9);
    doc.text(t.exemptionNote, 20, noteY);
    doc.text(t.generatedNote, 20, noteY + 5);
    doc.text(t.thankYou, 20, noteY + 10);
    
    // Generiranje PDF-a za preuzimanje
    const filename = `${invoiceNumber.replace(/\//g, '-')}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error("Greška pri generiranju PDF-a:", error);
  }
}