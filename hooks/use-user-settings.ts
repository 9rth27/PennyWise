'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export type UserCategory = {
  id: string;
  label: string;
  color: string;
};

export type UserSettings = {
  monthlyBudget: number;
  currency: string;
  theme: string;
  notifications: boolean;
  emailAlerts: boolean;
  defaultCategory: string;
  decimalPlaces: number;
  dateFormat: string;
  customCategories: UserCategory[];
  quickAddAmounts: Record<string, number>;
};

type UserSettingsRow = {
  monthly_budget: number | null;
  currency: string | null;
  theme: string | null;
  notifications: boolean | null;
  email_alerts: boolean | null;
  default_category: string | null;
  decimal_places: number | null;
  date_format: string | null;
  custom_categories: unknown;
  quick_add_amounts: unknown;
};

type SupabaseQueryError = {
  code?: string;
  message?: string;
};

const DEFAULT_MONTHLY_BUDGET = 10000;

const DEFAULT_QUICK_ADD_AMOUNTS: Record<string, number> = {
  tea: 50,
  lunch: 200,
  auto: 150,
  groceries: 500,
  misc: 100,
};

const DEFAULT_CUSTOM_CATEGORIES: UserCategory[] = [
  { id: 'tea', label: 'Tea/Coffee', color: 'amber' },
  { id: 'lunch', label: 'Lunch/Dinner', color: 'orange' },
  { id: 'auto', label: 'Auto/Cab', color: 'blue' },
  { id: 'groceries', label: 'Groceries', color: 'green' },
  { id: 'misc', label: 'Misc', color: 'purple' },
];

function getDefaultCustomCategories() {
  return DEFAULT_CUSTOM_CATEGORIES.map((category) => ({ ...category }));
}

function getDefaultQuickAddAmounts() {
  return { ...DEFAULT_QUICK_ADD_AMOUNTS };
}

function getDefaultUserSettings(): UserSettings {
  return {
    monthlyBudget: DEFAULT_MONTHLY_BUDGET,
    currency: 'INR',
    theme: 'dark',
    notifications: true,
    emailAlerts: false,
    defaultCategory: 'misc',
    decimalPlaces: 2,
    dateFormat: 'DD/MM/YYYY',
    customCategories: getDefaultCustomCategories(),
    quickAddAmounts: getDefaultQuickAddAmounts(),
  };
}

function sanitizeQuickAddAmounts(value: unknown, fallback: Record<string, number>) {
  const nextValues = { ...fallback };

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return nextValues;
  }

  Object.entries(value as Record<string, unknown>).forEach(([key, amount]) => {
    const parsedAmount = Number(amount);
    if (Number.isFinite(parsedAmount) && parsedAmount >= 0) {
      nextValues[key] = parsedAmount;
    }
  });

  return nextValues;
}

function sanitizeCategories(value: unknown, fallback: UserCategory[]) {
  if (!Array.isArray(value)) {
    return fallback.map((category) => ({ ...category }));
  }

  const seenIds = new Set<string>();
  const categories = value.reduce<UserCategory[]>((accumulator, item) => {
    if (!item || typeof item !== 'object') {
      return accumulator;
    }

    const maybeId = String((item as { id?: unknown }).id || '').trim();
    const maybeLabel = String((item as { label?: unknown }).label || '').trim();
    const maybeColor = String((item as { color?: unknown }).color || '').trim();

    if (!maybeId || !maybeLabel || !maybeColor || seenIds.has(maybeId)) {
      return accumulator;
    }

    seenIds.add(maybeId);
    accumulator.push({
      id: maybeId,
      label: maybeLabel,
      color: maybeColor,
    });

    return accumulator;
  }, []);

  if (categories.length === 0) {
    return fallback.map((category) => ({ ...category }));
  }

  return categories;
}

function normalizeSettingsRow(row?: UserSettingsRow | null): UserSettings {
  const fallback = getDefaultUserSettings();

  if (!row) {
    return fallback;
  }

  const parsedBudget = Number(row.monthly_budget);
  const parsedDecimalPlaces = Number(row.decimal_places);

  return {
    monthlyBudget: Number.isFinite(parsedBudget) && parsedBudget > 0 ? parsedBudget : fallback.monthlyBudget,
    currency: typeof row.currency === 'string' && row.currency.trim() ? row.currency : fallback.currency,
    theme: typeof row.theme === 'string' && row.theme.trim() ? row.theme : fallback.theme,
    notifications: typeof row.notifications === 'boolean' ? row.notifications : fallback.notifications,
    emailAlerts: typeof row.email_alerts === 'boolean' ? row.email_alerts : fallback.emailAlerts,
    defaultCategory:
      typeof row.default_category === 'string' && row.default_category.trim() ? row.default_category : fallback.defaultCategory,
    decimalPlaces:
      Number.isFinite(parsedDecimalPlaces) && parsedDecimalPlaces >= 0 && parsedDecimalPlaces <= 2
        ? parsedDecimalPlaces
        : fallback.decimalPlaces,
    dateFormat: typeof row.date_format === 'string' && row.date_format.trim() ? row.date_format : fallback.dateFormat,
    customCategories: sanitizeCategories(row.custom_categories, fallback.customCategories),
    quickAddAmounts: sanitizeQuickAddAmounts(row.quick_add_amounts, fallback.quickAddAmounts),
  };
}

function serializeSettings(settings: UserSettings) {
  return {
    monthly_budget: settings.monthlyBudget,
    currency: settings.currency,
    theme: settings.theme,
    notifications: settings.notifications,
    email_alerts: settings.emailAlerts,
    default_category: settings.defaultCategory,
    decimal_places: settings.decimalPlaces,
    date_format: settings.dateFormat,
    custom_categories: settings.customCategories,
    quick_add_amounts: settings.quickAddAmounts,
  };
}

function isMissingSchemaError(error?: SupabaseQueryError | null) {
  if (!error) {
    return false;
  }

  return error.code === '42P01' || error.code === 'PGRST205';
}

function isMissingColumnError(error?: SupabaseQueryError | null) {
  if (!error) {
    return false;
  }

  return error.code === '42703';
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(() => getDefaultUserSettings());
  const [isLoading, setIsLoading] = useState(true);
  const hasShownSchemaHintRef = useRef(false);
  const activeLoadRequestRef = useRef(0);

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  const loadSettings = useCallback(async () => {
    const requestId = ++activeLoadRequestRef.current;

    if (!supabase) {
      if (requestId !== activeLoadRequestRef.current) {
        return;
      }

      setSettings(getDefaultUserSettings());
      setIsLoading(false);
      return;
    }

    if (requestId === activeLoadRequestRef.current) {
      setIsLoading(true);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (requestId !== activeLoadRequestRef.current) {
      return;
    }

    if (!user) {
      setSettings(getDefaultUserSettings());
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select(
        'monthly_budget, currency, theme, notifications, email_alerts, default_category, decimal_places, date_format, custom_categories, quick_add_amounts',
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (requestId !== activeLoadRequestRef.current) {
      return;
    }

    if (error && isMissingColumnError(error)) {
      const { data: legacyData, error: legacyError } = await supabase
        .from('user_settings')
        .select('monthly_budget')
        .eq('user_id', user.id)
        .maybeSingle();

      if (requestId !== activeLoadRequestRef.current) {
        return;
      }

      if (legacyError) {
        if (isMissingSchemaError(legacyError) && !hasShownSchemaHintRef.current) {
          hasShownSchemaHintRef.current = true;
          toast.error('Database schema is missing. Run supabase/schema.sql in Supabase SQL Editor.');
        } else {
          console.warn('[Supabase] Failed to load user settings', legacyError);
        }

        setSettings(getDefaultUserSettings());
        setIsLoading(false);
        return;
      }

      const fallbackSettings = getDefaultUserSettings();
      const legacyBudget = Number((legacyData as { monthly_budget?: number | null } | null)?.monthly_budget);
      fallbackSettings.monthlyBudget = Number.isFinite(legacyBudget) && legacyBudget > 0
        ? legacyBudget
        : fallbackSettings.monthlyBudget;

      setSettings(fallbackSettings);
      setIsLoading(false);
      return;
    }

    if (error) {
      if (isMissingSchemaError(error) && !hasShownSchemaHintRef.current) {
        hasShownSchemaHintRef.current = true;
        toast.error('Database schema is missing. Run supabase/schema.sql in Supabase SQL Editor.');
      } else {
        console.warn('[Supabase] Failed to load user settings', error);
      }

      setSettings(getDefaultUserSettings());
      setIsLoading(false);
      return;
    }

    const normalizedSettings = normalizeSettingsRow((data as UserSettingsRow | null) || null);
    setSettings(normalizedSettings);

    if (!data) {
      if (requestId !== activeLoadRequestRef.current) {
        return;
      }

      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            ...serializeSettings(normalizedSettings),
          },
          {
            onConflict: 'user_id',
          },
        );

      if (requestId !== activeLoadRequestRef.current) {
        return;
      }

      if (upsertError && isMissingColumnError(upsertError)) {
        await supabase
          .from('user_settings')
          .upsert(
            {
              user_id: user.id,
              monthly_budget: normalizedSettings.monthlyBudget,
            },
            {
              onConflict: 'user_id',
            },
          );

        if (requestId !== activeLoadRequestRef.current) {
          return;
        }
      }
    }

    if (requestId !== activeLoadRequestRef.current) {
      return;
    }

    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadSettings();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadSettings, supabase]);

  const saveSettings = useCallback(
    async (override?: UserSettings) => {
      const settingsToSave = override || settings;

      if (!supabase) {
        toast.error('Database is not configured yet.');
        return false;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please log in to save settings.');
        return false;
      }

      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            ...serializeSettings(settingsToSave),
          },
          {
            onConflict: 'user_id',
          },
        );

      if (error && isMissingColumnError(error)) {
        const { error: legacyError } = await supabase
          .from('user_settings')
          .upsert(
            {
              user_id: user.id,
              monthly_budget: settingsToSave.monthlyBudget,
            },
            {
              onConflict: 'user_id',
            },
          );

        if (legacyError) {
          if (isMissingSchemaError(legacyError) && !hasShownSchemaHintRef.current) {
            hasShownSchemaHintRef.current = true;
            toast.error('Database schema is missing. Run supabase/schema.sql in Supabase SQL Editor.');
          } else {
            console.warn('[Supabase] Failed to save user settings', legacyError);
          }

          toast.error('Unable to save settings right now.');
          return false;
        }

        return true;
      }

      if (error) {
        if (isMissingSchemaError(error) && !hasShownSchemaHintRef.current) {
          hasShownSchemaHintRef.current = true;
          toast.error('Database schema is missing. Run supabase/schema.sql in Supabase SQL Editor.');
        } else {
          console.warn('[Supabase] Failed to save user settings', error);
        }

        toast.error('Unable to save settings right now.');
        return false;
      }

      return true;
    },
    [settings, supabase],
  );

  const setSetting = useCallback(function <K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  }, []);

  const updateQuickAddAmount = useCallback((categoryId: string, amount: number) => {
    setSettings((previous) => ({
      ...previous,
      quickAddAmounts: {
        ...previous.quickAddAmounts,
        [categoryId]: Number.isFinite(amount) && amount >= 0 ? amount : 0,
      },
    }));
  }, []);

  const addCustomCategory = useCallback((category: UserCategory) => {
    setSettings((previous) => {
      if (previous.customCategories.some((item) => item.id === category.id)) {
        return previous;
      }

      return {
        ...previous,
        customCategories: [...previous.customCategories, category],
      };
    });
  }, []);

  const removeCustomCategory = useCallback((categoryId: string) => {
    setSettings((previous) => {
      const remainingCategories = previous.customCategories.filter((item) => item.id !== categoryId);
      const fallbackCategories = remainingCategories.length > 0 ? remainingCategories : getDefaultCustomCategories();

      return {
        ...previous,
        customCategories: fallbackCategories,
        defaultCategory: previous.defaultCategory === categoryId ? 'misc' : previous.defaultCategory,
      };
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(getDefaultUserSettings());
  }, []);

  return {
    settings,
    isLoading,
    setSetting,
    updateQuickAddAmount,
    addCustomCategory,
    removeCustomCategory,
    saveSettings,
    resetSettings,
    reloadSettings: loadSettings,
  };
}
