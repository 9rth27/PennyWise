export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD';
export type AppTheme = 'dark' | 'light' | 'system';
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD-MMM-YYYY';
export type QuickAddKey = 'tea' | 'lunch' | 'auto' | 'groceries' | 'misc';
export type CategoryColor = 'red' | 'orange' | 'amber' | 'green' | 'blue' | 'purple' | 'pink';

export interface CustomCategory {
  id: string;
  label: string;
  color: CategoryColor;
}

export interface UserAppSettings {
  currency: CurrencyCode;
  theme: AppTheme;
  notifications: boolean;
  emailAlerts: boolean;
  defaultCategory: string;
  decimalPlaces: 0 | 1 | 2;
  dateFormat: DateFormat;
}

export type QuickAddAmounts = Record<QuickAddKey, number>;

const CURRENCY_CODES: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP', 'AUD'];
const THEMES: AppTheme[] = ['dark', 'light', 'system'];
const DATE_FORMATS: DateFormat[] = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MMM-YYYY'];
const CATEGORY_COLORS: CategoryColor[] = ['red', 'orange', 'amber', 'green', 'blue', 'purple', 'pink'];

export const DEFAULT_USER_APP_SETTINGS: UserAppSettings = {
  currency: 'INR',
  theme: 'dark',
  notifications: true,
  emailAlerts: false,
  defaultCategory: 'misc',
  decimalPlaces: 2,
  dateFormat: 'DD/MM/YYYY',
};

export const DEFAULT_QUICK_ADD_AMOUNTS: QuickAddAmounts = {
  tea: 50,
  lunch: 200,
  auto: 150,
  groceries: 500,
  misc: 100,
};

export const DEFAULT_CUSTOM_CATEGORIES: CustomCategory[] = [
  { id: 'tea', label: 'Tea/Coffee', color: 'amber' },
  { id: 'lunch', label: 'Lunch/Dinner', color: 'orange' },
  { id: 'auto', label: 'Auto/Cab', color: 'blue' },
  { id: 'groceries', label: 'Groceries', color: 'green' },
  { id: 'misc', label: 'Misc', color: 'purple' },
];

export type UserSettingsRowLike = Partial<{
  currency: unknown;
  theme: unknown;
  notifications: unknown;
  email_alerts: unknown;
  default_category: unknown;
  decimal_places: unknown;
  date_format: unknown;
  quick_add_amounts: unknown;
  custom_categories: unknown;
}>;

export function createDefaultUserAppSettings(): UserAppSettings {
  return { ...DEFAULT_USER_APP_SETTINGS };
}

export function createDefaultQuickAddAmounts(): QuickAddAmounts {
  return { ...DEFAULT_QUICK_ADD_AMOUNTS };
}

export function createDefaultCustomCategories(): CustomCategory[] {
  return DEFAULT_CUSTOM_CATEGORIES.map((category) => ({ ...category }));
}

export function sanitizeCategoryId(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function toNonNegativeInteger(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.round(parsed);
}

function normalizeCategoryColor(value: unknown): CategoryColor {
  if (typeof value !== 'string') {
    return 'purple';
  }

  const color = value.toLowerCase() as CategoryColor;
  return CATEGORY_COLORS.includes(color) ? color : 'purple';
}

export function normalizeQuickAddAmounts(value: unknown): QuickAddAmounts {
  const source = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

  return {
    tea: toNonNegativeInteger(source.tea, DEFAULT_QUICK_ADD_AMOUNTS.tea),
    lunch: toNonNegativeInteger(source.lunch, DEFAULT_QUICK_ADD_AMOUNTS.lunch),
    auto: toNonNegativeInteger(source.auto, DEFAULT_QUICK_ADD_AMOUNTS.auto),
    groceries: toNonNegativeInteger(source.groceries, DEFAULT_QUICK_ADD_AMOUNTS.groceries),
    misc: toNonNegativeInteger(source.misc, DEFAULT_QUICK_ADD_AMOUNTS.misc),
  };
}

export function normalizeCustomCategories(value: unknown): CustomCategory[] {
  if (!Array.isArray(value)) {
    return createDefaultCustomCategories();
  }

  const normalized: CustomCategory[] = [];
  const usedIds = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const label = typeof record.label === 'string' ? record.label.trim() : '';
    const rawId = typeof record.id === 'string' ? record.id : label;
    const id = sanitizeCategoryId(rawId);

    if (!id || !label || usedIds.has(id)) {
      continue;
    }

    normalized.push({
      id,
      label: label.slice(0, 40),
      color: normalizeCategoryColor(record.color),
    });

    usedIds.add(id);
  }

  if (normalized.length === 0) {
    return createDefaultCustomCategories();
  }

  return normalized;
}

function parseDecimalPlaces(value: unknown): 0 | 1 | 2 {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return DEFAULT_USER_APP_SETTINGS.decimalPlaces;
  }

  const rounded = Math.round(parsed);
  if (rounded === 0 || rounded === 1 || rounded === 2) {
    return rounded;
  }

  return DEFAULT_USER_APP_SETTINGS.decimalPlaces;
}

export function normalizeUserAppSettings(row: UserSettingsRowLike | null | undefined): UserAppSettings {
  const currency =
    typeof row?.currency === 'string' && CURRENCY_CODES.includes(row.currency as CurrencyCode)
      ? (row.currency as CurrencyCode)
      : DEFAULT_USER_APP_SETTINGS.currency;

  const theme =
    typeof row?.theme === 'string' && THEMES.includes(row.theme as AppTheme)
      ? (row.theme as AppTheme)
      : DEFAULT_USER_APP_SETTINGS.theme;

  const defaultCategory =
    typeof row?.default_category === 'string' && sanitizeCategoryId(row.default_category)
      ? sanitizeCategoryId(row.default_category)
      : DEFAULT_USER_APP_SETTINGS.defaultCategory;

  const dateFormat =
    typeof row?.date_format === 'string' && DATE_FORMATS.includes(row.date_format as DateFormat)
      ? (row.date_format as DateFormat)
      : DEFAULT_USER_APP_SETTINGS.dateFormat;

  return {
    currency,
    theme,
    notifications:
      typeof row?.notifications === 'boolean' ? row.notifications : DEFAULT_USER_APP_SETTINGS.notifications,
    emailAlerts: typeof row?.email_alerts === 'boolean' ? row.email_alerts : DEFAULT_USER_APP_SETTINGS.emailAlerts,
    defaultCategory,
    decimalPlaces: parseDecimalPlaces(row?.decimal_places),
    dateFormat,
  };
}