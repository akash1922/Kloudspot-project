/**
 * Converts a numeric amount to Indian English words in real-time.
 * e.g.
 *   500     -> "Five Hundred Rupees"
 *   50000   -> "Fifty Thousand Rupees"
 *   1250000 -> "Twelve Lakh Fifty Thousand Rupees"
 */

const ones = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const tens = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

const convertLessThanThousand = (n) => {
  let str = '';
  if (n >= 100) {
    str += ones[Math.floor(n / 100)] + ' Hundred';
    n %= 100;
    if (n > 0) str += ' ';
  }
  if (n > 0) {
    if (n < 20) {
      str += ones[n];
    } else {
      str += tens[Math.floor(n / 10)];
      if (n % 10 > 0) {
        str += ' ' + ones[n % 10];
      }
    }
  }
  return str;
};

export const numberToWords = (value, includeRupees = true) => {
  if (value === null || value === undefined || value === '') return '';

  const numStr = String(value).replace(/,/g, '').trim();
  const num = Number(numStr);

  if (isNaN(num) || num < 0) return '';
  if (num === 0) return includeRupees ? 'Zero Rupees' : 'Zero';

  const parts = numStr.split('.');
  let integerPart = parseInt(parts[0], 10);
  if (isNaN(integerPart)) return '';

  if (integerPart === 0 && (!parts[1] || parseInt(parts[1], 10) === 0)) {
    return includeRupees ? 'Zero Rupees' : 'Zero';
  }

  let words = '';

  // Crores (>= 10,000,000)
  const crore = Math.floor(integerPart / 10000000);
  integerPart %= 10000000;

  // Lakhs (>= 100,000)
  const lakh = Math.floor(integerPart / 100000);
  integerPart %= 100000;

  // Thousands (>= 1,000)
  const thousand = Math.floor(integerPart / 1000);
  integerPart %= 1000;

  // Remaining (hundreds + tens + units)
  const remainder = integerPart;

  if (crore > 0) {
    words += convertLessThanThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    words += convertLessThanThousand(remainder) + ' ';
  }

  words = words.trim();

  // Decimal / Paise handling
  let paiseWords = '';
  if (parts.length > 1 && parts[1]) {
    const paiseStr = parts[1].slice(0, 2).padEnd(2, '0');
    const paise = parseInt(paiseStr, 10);
    if (paise > 0) {
      paiseWords = convertLessThanThousand(paise) + ' Paise';
    }
  }

  if (!words && paiseWords) {
    return paiseWords + ' Only';
  }

  if (includeRupees) {
    let result = words + ' Rupees';
    if (paiseWords) {
      result += ' and ' + paiseWords;
    }
    return result;
  }

  return words;
};
