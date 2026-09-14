import { Product } from '../types';

export function exportInventoryCSV(products: Product[]): void {
  // Headers
  const headers = ['Nom Article', 'Catégorie', 'Prix Unitaire (FCFA)', 'Quantité', 'Valeur Totale (FCFA)', 'Statut'];

  // Rows
  const rows = products.map((p) => {
    let statut = 'EN STOCK';
    if (p.quantity === 0) {
      statut = 'RUPTURE';
    } else if (p.quantity <= 5) {
      statut = 'STOCK FAIBLE';
    }
    const valeurTotale = p.unitPrice * p.quantity;

    return [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      p.unitPrice,
      p.quantity,
      valeurTotale,
      `"${statut}"`,
    ].join(';'); // Semicolon is standard for European/French Excel CSVs
  });

  // UTF-8 BOM (\uFEFF) ensures Excel opens accented characters (Ciment, Électricité, etc.) cleanly
  const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'quincastock-inventaire.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
