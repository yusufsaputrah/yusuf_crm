/**
 * @file formatUtils.js
 * @description Utility functions for formatting currency, dates, and numbers.
 */

/**
 * Format a number as Indonesian Rupiah.
 * @param {number|string} amount
 * @returns {string} e.g. "Rp 1.500.000"
 */
export const formatRupiah = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

/**
 * Format ISO date string to localized Indonesian date.
 * @param {string} dateString
 * @returns {string} e.g. "15 Jan 2024"
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
};

/**
 * Format ISO date string to relative time (e.g. "3 hari lalu").
 * @param {string} dateString
 * @returns {string}
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '-';
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Hari ini';
  if (days === 1) return 'Kemarin';
  if (days < 30) return `${days} hari lalu`;
  if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;
  return `${Math.floor(days / 365)} tahun lalu`;
};

/**
 * Truncate string to max length.
 * @param {string} str
 * @param {number} maxLength
 */
export const truncate = (str, maxLength = 40) => {
  if (!str) return '-';
  return str.length > maxLength ? str.slice(0, maxLength) + '…' : str;
};
