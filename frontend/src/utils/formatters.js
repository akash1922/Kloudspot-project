const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Reusable Currency Formatter
 * Formats a monetary number into Indian Rupee format with ₹ symbol (e.g., ₹ 1,35,000.00)
 */
export const formatCurrency = (val) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '₹ 0.00';
  const num = Number(val);
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₹ ${formatted}`;
};

/**
 * Reusable Date Formatter
 * Formats a date string (YYYY-MM-DD or ISO) into standard 'dd-MMM-yyyy' (e.g., 15-Oct-2026)
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const raw = String(dateStr).trim().slice(0, 10);
    const parts = raw.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2].padStart(2, '0');
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day}-${MONTHS[monthIdx]}-${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = MONTHS[d.getMonth()];
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch {
    // Fallback to raw string
  }
  return dateStr;
};

/**
 * Reusable DateTime Formatter with Exact Seconds
 * Formats an ISO date/time string into 'dd-MMM-yyyy HH:mm:ss' (e.g., 15-Oct-2026 21:05:43)
 */
export const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '—';
  try {
    const d = new Date(dateTimeStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = MONTHS[d.getMonth()];
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    }
  } catch {
    // Fallback to raw string
  }
  return dateTimeStr;
};
