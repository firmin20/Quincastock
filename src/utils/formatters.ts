export const OWNER_CONTACT = {
  whatsappDisplay: '+237 696 019 303',
  whatsappRaw: '696019303',
  whatsappUrl: 'https://wa.me/237696019303',
  whatsappProUrl: 'https://wa.me/237696019303?text=Bonjour,%20je%20veux%20QuincaStock%20PRO',
  phoneDisplay: '+237 670 566 705',
  phoneRaw: '670566705',
  phoneUrl: 'tel:+237670566705',
  email: 'firmintela7@gmail.com',
  emailUrl: 'mailto:firmintela7@gmail.com',
};

export const VALID_PRO_CODES = [
  'QUINCA-AF01',
  'QUINCA-AF02',
  'QUINCA-AF03',
  'QUINCA-AF04',
  'QUINCA-AF05',
  'QUINCA-AF06',
  'QUINCA-AF07',
  'QUINCA-AF08',
  'QUINCA-AF09',
  'QUINCA-AF10',
  'QUINCA-PRO01',
  'QUINCA-PRO02',
  'QUINCA-PRO03',
  'QUINCA-VIP01',
  'QUINCA-2026'
];

/**
 * Format a number as FCFA currency string: e.g. "15 000 FCFA"
 */
export function formatFCFA(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 FCFA';
  }
  const rounded = Math.round(amount);
  // Using Intl with space separator
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

/**
 * Format a date timestamp into French standard: DD/MM/YYYY HH:mm
 */
export function formatDateFR(isoOrDateString: string): string {
  try {
    const d = new Date(isoOrDateString);
    if (isNaN(d.getTime())) return isoOrDateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} à ${hours}:${minutes}`;
  } catch {
    return isoOrDateString;
  }
}

/**
 * Check if a timestamp is from today
 */
export function isToday(isoOrDateString: string): boolean {
  try {
    const d = new Date(isoOrDateString);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  } catch {
    return false;
  }
}

/**
 * Verify PRO code (case-insensitive, trims white spaces)
 */
export function verifyProCode(inputCode: string): boolean {
  if (!inputCode) return false;
  const clean = inputCode.trim().toUpperCase();
  return VALID_PRO_CODES.includes(clean);
}
