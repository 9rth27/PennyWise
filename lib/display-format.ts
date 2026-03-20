const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD'] as const;
const SUPPORTED_DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MMM-YYYY'] as const;

type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
type SupportedDateFormat = (typeof SUPPORTED_DATE_FORMATS)[number];

const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
};

function toFiniteNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseDateInput(value: string | Date) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const isoDateMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    const year = Number(isoDateMatch[1]);
    const month = Number(isoDateMatch[2]);
    const day = Number(isoDateMatch[3]);
    return new Date(year, month - 1, day);
  }

  const parsedDate = new Date(trimmedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

export function normalizeCurrencyCode(value: unknown): SupportedCurrency {
  const code = String(value || '').toUpperCase().trim();
  return SUPPORTED_CURRENCIES.includes(code as SupportedCurrency) ? (code as SupportedCurrency) : 'INR';
}

export function normalizeDateFormat(value: unknown): SupportedDateFormat {
  const format = String(value || '').toUpperCase().trim();
  return SUPPORTED_DATE_FORMATS.includes(format as SupportedDateFormat) ? (format as SupportedDateFormat) : 'DD/MM/YYYY';
}

export function normalizeDecimalPlaces(value: unknown) {
  const parsed = Math.round(toFiniteNumber(value, 2));
  return Math.min(2, Math.max(0, parsed));
}

export function getCurrencySymbol(currencyCode: unknown) {
  const normalizedCurrency = normalizeCurrencyCode(currencyCode);
  return CURRENCY_SYMBOLS[normalizedCurrency];
}

export function formatCurrencyAmount(amount: unknown, currencyCode: unknown, decimalPlaces: unknown) {
  const normalizedCurrency = normalizeCurrencyCode(currencyCode);
  const normalizedDecimalPlaces = normalizeDecimalPlaces(decimalPlaces);
  const safeAmount = toFiniteNumber(amount, 0);

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: normalizedDecimalPlaces,
    maximumFractionDigits: normalizedDecimalPlaces,
  }).format(safeAmount);
}

export function formatDecimalAmount(amount: unknown, decimalPlaces: unknown) {
  const normalizedDecimalPlaces = normalizeDecimalPlaces(decimalPlaces);
  const safeAmount = toFiniteNumber(amount, 0);

  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: normalizedDecimalPlaces,
    maximumFractionDigits: normalizedDecimalPlaces,
  }).format(safeAmount);
}

export function formatDateValue(value: string | Date, dateFormat: unknown) {
  const parsedDate = parseDateInput(value);
  if (!parsedDate) {
    return typeof value === 'string' ? value : '';
  }

  const normalizedDateFormat = normalizeDateFormat(dateFormat);
  const day = String(parsedDate.getDate()).padStart(2, '0');
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const year = String(parsedDate.getFullYear());

  if (normalizedDateFormat === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }

  if (normalizedDateFormat === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`;
  }

  if (normalizedDateFormat === 'DD-MMM-YYYY') {
    const shortMonth = parsedDate.toLocaleString('en-US', { month: 'short' });
    return `${day}-${shortMonth}-${year}`;
  }

  return `${day}/${month}/${year}`;
}
