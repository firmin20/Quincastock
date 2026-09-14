import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product } from '../types';
import { formatFCFA, formatDateFR } from './formatters';

export function exportInventoryPDF(products: Product[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const dateStr = formatDateFR(now.toISOString());

  // Brand Header
  doc.setFillColor(31, 41, 55); // Dark Gray #1f2937
  doc.rect(0, 0, 210, 28, 'F');

  // Orange brand accent bar
  doc.setFillColor(249, 115, 22); // Orange #f97316
  doc.rect(0, 28, 210, 3, 'F');

  // Title in Header
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('QUINCASTOCK', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(229, 231, 235);
  doc.text('Gestion Quincaillerie Pro - Fiche d\'Inventaire Officielle', 14, 21);

  // Date on right of header
  doc.setFontSize(9);
  doc.setTextColor(209, 213, 219);
  doc.text(`Édité le : ${dateStr}`, 196, 17, { align: 'right' });

  // Summary Card / Box
  const totalProducts = products.length;
  const totalValue = products.reduce((acc, p) => acc + p.unitPrice * p.quantity, 0);
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= 5).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;

  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(14, 37, 182, 22, 2, 2, 'FD');

  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text("RÉSUMÉ DU STOCK", 18, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(`Total articles : ${totalProducts} références`, 18, 52);
  doc.text(`Articles en stock faible : ${lowStockCount} | En rupture : ${outOfStockCount}`, 75, 52);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(249, 115, 22);
  doc.text(`Valeur totale du stock : ${formatFCFA(totalValue)}`, 140, 52);

  // Table Data
  const tableRows = products.map((p) => {
    let statut = 'EN STOCK';
    if (p.quantity === 0) {
      statut = 'RUPTURE';
    } else if (p.quantity <= 5) {
      statut = 'STOCK FAIBLE';
    }
    const valTotale = p.unitPrice * p.quantity;

    return [
      p.name,
      p.category,
      formatFCFA(p.unitPrice),
      String(p.quantity),
      formatFCFA(valTotale),
      statut,
    ];
  });

  autoTable(doc, {
    startY: 65,
    head: [['Nom Article', 'Catégorie', 'Prix Unitaire', 'Quantité', 'Valeur Totale', 'Statut']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [31, 41, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    bodyStyles: {
      textColor: [31, 41, 55],
      fontSize: 8.5,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 30 },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 32, halign: 'right' },
      5: { cellWidth: 22, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const text = String(data.cell.raw);
        if (text === 'RUPTURE') {
          data.cell.styles.textColor = [220, 38, 38]; // Red
          data.cell.styles.fontStyle = 'bold';
        } else if (text === 'STOCK FAIBLE') {
          data.cell.styles.textColor = [217, 119, 6]; // Amber/Orange
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [22, 101, 52]; // Green
        }
      }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer on every page
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(
        'QUINCASTOCK - Gestion Quincaillerie Pro | firmintela7@gmail.com | +237 696 019 303',
        14,
        290
      );
      doc.text(`Page ${data.pageNumber} sur ${pageCount}`, 196, 290, { align: 'right' });
    },
  });

  // Save the PDF
  doc.save(`quincastock-inventaire-${now.toISOString().split('T')[0]}.pdf`);
}
