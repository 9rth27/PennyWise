'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DashboardCard } from '@/components/dashboard-card';
import { useExpenses } from '@/hooks/use-expenses';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  createDefaultCustomCategories,
  createDefaultQuickAddAmounts,
  createDefaultUserAppSettings,
  normalizeCustomCategories,
  normalizeQuickAddAmounts,
  normalizeUserAppSettings,
  sanitizeCategoryId,
  type CategoryColor,
  type DateFormat,
  type QuickAddAmounts,
  type QuickAddKey,
  type UserAppSettings,
} from '@/lib/user-settings';

type UserSettingsSelectRow = {
  currency: unknown;
  theme: unknown;
  notifications: unknown;
  email_alerts: unknown;
  default_category: unknown;
  decimal_places: unknown;
  date_format: unknown;
  quick_add_amounts: unknown;
  custom_categories: unknown;
};

const colorOptions: Array<{ name: string; value: CategoryColor; bg: string; border: string }> = [
  { name: 'Red', value: 'red', bg: 'bg-red-100', border: 'border-red-600' },
  { name: 'Orange', value: 'orange', bg: 'bg-orange-100', border: 'border-orange-600' },
  { name: 'Amber', value: 'amber', bg: 'bg-amber-100', border: 'border-amber-600' },
  { name: 'Green', value: 'green', bg: 'bg-green-100', border: 'border-green-600' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-100', border: 'border-blue-600' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-100', border: 'border-purple-600' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-100', border: 'border-pink-600' },
];

const quickAddItems: Array<{ id: QuickAddKey; label: string; emoji: string }> = [
  { id: 'tea', label: 'Tea/Coffee', emoji: '☕' },
  { id: 'lunch', label: 'Lunch/Dinner', emoji: '🍽️' },
  { id: 'auto', label: 'Auto/Cab', emoji: '🚕' },
  { id: 'groceries', label: 'Groceries', emoji: '🛒' },
  { id: 'misc', label: 'Misc', emoji: '📦' },
];

function resolveDefaultCategory(
  categories: ReturnType<typeof createDefaultCustomCategories>,
  requestedCategory: string,
) {
  if (categories.some((category) => category.id === requestedCategory)) {
    return requestedCategory;
  }

  return categories[0]?.id || 'misc';
}

export default function SettingsPage() {
  const { monthlyBudget, updateBudget, clearData } = useExpenses();
  const [settings, setSettings] = useState<UserAppSettings>(createDefaultUserAppSettings);
  const [customCategories, setCustomCategories] = useState(createDefaultCustomCategories);

  const [newCategory, setNewCategory] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState<CategoryColor>('red');
  const [quickAddAmounts, setQuickAddAmounts] = useState<QuickAddAmounts>(createDefaultQuickAddAmounts);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  const loadUserSettings = useCallback(async () => {
    if (!supabase) {
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCurrentUserId(null);
        setSettings(createDefaultUserAppSettings());
        setQuickAddAmounts(createDefaultQuickAddAmounts());
        setCustomCategories(createDefaultCustomCategories());
        return;
      }

      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('user_settings')
        .select('currency, theme, notifications, email_alerts, default_category, decimal_places, date_format, quick_add_amounts, custom_categories')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        toast.error('Unable to load account settings right now.');
        return;
      }

      if (!data) {
        setSettings(createDefaultUserAppSettings());
        setQuickAddAmounts(createDefaultQuickAddAmounts());
        setCustomCategories(createDefaultCustomCategories());
        return;
      }

      const row = data as UserSettingsSelectRow;
      const normalizedCategories = normalizeCustomCategories(row.custom_categories);
      const normalizedSettings = normalizeUserAppSettings(row);
      const safeDefaultCategory = resolveDefaultCategory(normalizedCategories, normalizedSettings.defaultCategory);

      setCustomCategories(normalizedCategories);
      setQuickAddAmounts(normalizeQuickAddAmounts(row.quick_add_amounts));
      setSettings({
        ...normalizedSettings,
        defaultCategory: safeDefaultCategory,
      });
    }
  }, [supabase]);

  useEffect(() => {
    void loadUserSettings();
  }, [loadUserSettings]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadUserSettings();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserSettings, supabase]);

  const handleSettingChange = <K extends keyof UserAppSettings>(key: K, value: UserAppSettings[K]) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
  };

  const persistSettings = useCallback(async () => {
    if (!supabase) {
      toast.error('Database is not configured yet.');
      return false;
    }

    let userId = currentUserId;

    if (!userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please log in to save your settings.');
        return false;
      }

      userId = user.id;
      setCurrentUserId(user.id);
    }

    const normalizedCategories = normalizeCustomCategories(customCategories);
    const normalizedQuickAddAmounts = normalizeQuickAddAmounts(quickAddAmounts);
    const safeDefaultCategory = resolveDefaultCategory(normalizedCategories, settings.defaultCategory);

    const { error } = await supabase.from('user_settings').upsert(
      {
        user_id: userId,
        monthly_budget: monthlyBudget,
        currency: settings.currency,
        theme: settings.theme,
        notifications: settings.notifications,
        email_alerts: settings.emailAlerts,
        default_category: safeDefaultCategory,
        decimal_places: settings.decimalPlaces,
        date_format: settings.dateFormat,
        quick_add_amounts: normalizedQuickAddAmounts,
        custom_categories: normalizedCategories,
      },
      {
        onConflict: 'user_id',
      },
    );

    if (error) {
      toast.error('Unable to save settings right now.');
      return false;
    }

    setSettings((previous) => ({ ...previous, defaultCategory: safeDefaultCategory }));
    setQuickAddAmounts(normalizedQuickAddAmounts);
    setCustomCategories(normalizedCategories);
    return true;
  }, [currentUserId, customCategories, monthlyBudget, quickAddAmounts, settings, supabase]);

  const handleSave = useCallback(async () => {
    const isSaved = await persistSettings();
    if (isSaved) {
      toast.success('Settings saved successfully!');
    }
  }, [persistSettings]);

  const handleClearAll = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all transaction history? This cannot be undone.')) {
      const isCleared = await clearData();
      if (isCleared) {
        toast.info('All transaction data cleared');
      }
    }
  }, [clearData]);

  const addCustomCategory = useCallback(() => {
    const label = newCategory.trim();
    if (label) {
      const id = sanitizeCategoryId(label);

      if (!id) {
        toast.error('Enter a valid category name.');
        return;
      }

      if (customCategories.some((category) => category.id === id)) {
        toast.error('That category already exists.');
        return;
      }

      const newCat = {
        id,
        label,
        color: newCategoryColor,
      };

      setCustomCategories((previous) => [...previous, newCat]);
      setNewCategory('');
      setNewCategoryColor('red');
    }
  }, [customCategories, newCategory, newCategoryColor]);

  const removeCategory = useCallback((id: string) => {
    setCustomCategories((previous) => {
      if (previous.length <= 1) {
        toast.error('At least one category is required.');
        return previous;
      }

      const nextCategories = previous.filter((category) => category.id !== id);
      if (nextCategories.length === previous.length) {
        return previous;
      }

      setSettings((current) => ({
        ...current,
        defaultCategory: resolveDefaultCategory(nextCategories, current.defaultCategory),
      }));

      return nextCategories;
    });
  }, []);

  const handleQuickAddAmountChange = useCallback((id: QuickAddKey, rawValue: string) => {
    const parsed = Number.parseInt(rawValue, 10);
    const nextValue = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;

    setQuickAddAmounts((previous) => ({
      ...previous,
      [id]: nextValue,
    }));
  }, []);

  const handleResetDefaults = useCallback(() => {
    setSettings(createDefaultUserAppSettings());
    setCustomCategories(createDefaultCustomCategories());
    setQuickAddAmounts(createDefaultQuickAddAmounts());
    void updateBudget(10000);
    toast.info('Default values restored. Save to sync preferences to your account.');
  }, [updateBudget]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-4 border-black rounded-xl p-6 sm:p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="font-black text-3xl sm:text-4xl mb-2">Settings & Customizations</h1>
        <p className="text-gray-600 font-bold text-base sm:text-lg">Personalize your money tracking experience</p>
      </div>

      {/* Budget Settings */}
      <DashboardCard title="Budget Settings">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-black mb-2">Monthly Budget Limit</label>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <input
                type="number"
                value={monthlyBudget}
                onChange={(e) => {
                  const parsedValue = Number.parseInt(e.target.value, 10);
                  if (!Number.isNaN(parsedValue)) {
                    void updateBudget(parsedValue);
                  }
                }}
                className="border border-black rounded-lg px-4 py-2 font-bold flex-1 focus:border-black focus:outline-none focus:ring-0"
              />
              <span className="font-bold text-lg">₹</span>
            </div>
            <p className="text-xs text-gray-600 font-bold mt-2">Set your target monthly spending limit</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-2">Default Category</label>
            <select
              value={settings.defaultCategory}
              onChange={(e) => handleSettingChange('defaultCategory', e.target.value)}
              className="border border-black rounded-lg px-4 py-2 font-bold w-full focus:border-black focus:outline-none focus:ring-0"
            >
              {customCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 font-bold mt-2">Category selected by default in quick add</p>
          </div>
        </div>
      </DashboardCard>

      {/* Display Settings */}
      <DashboardCard title="Display Settings">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-black mb-2">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => handleSettingChange('currency', e.target.value as UserAppSettings['currency'])}
              className="border border-black rounded-lg px-4 py-2 font-bold w-full focus:border-black focus:outline-none focus:ring-0"
            >
              <option value="INR">Indian Rupee (₹)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">British Pound (£)</option>
              <option value="AUD">Australian Dollar (A$)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-2">Date Format</label>
            <select
              value={settings.dateFormat}
              onChange={(e) => handleSettingChange('dateFormat', e.target.value as DateFormat)}
              className="border border-black rounded-lg px-4 py-2 font-bold w-full focus:border-black focus:outline-none focus:ring-0"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="DD-MMM-YYYY">DD-MMM-YYYY</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-2">Decimal Places</label>
            <select
              value={settings.decimalPlaces}
              onChange={(e) => handleSettingChange('decimalPlaces', parseInt(e.target.value))}
              className="border border-black rounded-lg px-4 py-2 font-bold w-full focus:border-black focus:outline-none focus:ring-0"
            >
              <option value={0}>0 (₹1000)</option>
              <option value={1}>1 (₹1000.0)</option>
              <option value={2}>2 (₹1000.00)</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {/* Notification Settings */}
      <DashboardCard title="Notification Settings">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2 border-black rounded-lg p-4 bg-gray-50">
            <div>
              <p className="font-bold text-black">In-App Notifications</p>
              <p className="text-xs text-gray-600 font-bold">Get alerts for budget limits</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => handleSettingChange('notifications', e.target.checked)}
              className="w-6 h-6 cursor-pointer"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2 border-black rounded-lg p-4 bg-gray-50">
            <div>
              <p className="font-bold text-black">Email Alerts</p>
              <p className="text-xs text-gray-600 font-bold">Weekly spending summary emails</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailAlerts}
              onChange={(e) => handleSettingChange('emailAlerts', e.target.checked)}
              className="w-6 h-6 cursor-pointer"
            />
          </div>
        </div>
      </DashboardCard>

      {/* Manage Categories */}
      <DashboardCard title="Manage Expense Categories">
        <div className="space-y-4">
          {/* Current Categories */}
          <div>
            <p className="font-bold text-black mb-3">Current Categories</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {customCategories.map((cat) => {
                const color = colorOptions.find((c) => c.value === cat.color);
                return (
                  <div key={cat.id} className={`border-3 ${color?.border} rounded-lg p-3 ${color?.bg}`}>
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold text-sm text-black">{cat.label}</p>
                      <button
                        onClick={() => removeCategory(cat.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 capitalize">{cat.color}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add New Category */}
          <div className="border-2 border-black rounded-lg p-4 bg-gray-50">
            <p className="font-bold text-black mb-3">Add New Category</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Category name (e.g., Entertainment)"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="border border-black rounded-lg px-4 py-2 font-bold w-full focus:border-black focus:outline-none focus:ring-0"
              />
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Select Color</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewCategoryColor(color.value)}
                      className={`border-3 rounded-lg p-2 transition-all ${
                        newCategoryColor === color.value
                          ? `${color.border} ${color.bg} border-4`
                          : `border-gray-300 ${color.bg}`
                      }`}
                      title={color.name}
                    >
                      <div className="text-xs font-bold">{color.name}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={addCustomCategory}
                className="w-full border-3 border-black rounded-lg p-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
              >
                + Add Category
              </button>
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Quick Add Customization */}
      <DashboardCard title="Quick Add Customization">
        <div className="space-y-4">
          <p className="text-sm font-bold text-gray-600 mb-4">Set predetermined amounts for one-tap additions on the dashboard</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickAddItems.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border-2 border-black rounded-lg p-3 bg-gray-50">
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-black text-sm">{item.label}</p>
                </div>
                <div className="flex items-center gap-2 w-full justify-between sm:w-auto sm:justify-start">
                  <span className="font-black">₹</span>
                  <input
                    type="number"
                    value={quickAddAmounts[item.id] || ''}
                    onChange={(e) => handleQuickAddAmountChange(item.id, e.target.value)}
                    className="border border-black rounded px-2 py-1 font-bold w-24 sm:w-20 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardCard>

      {/* Data Settings */}
      <DashboardCard title="Data & Privacy">
        <div className="space-y-3">
          <button className="w-full border-3 border-blue-600 rounded-lg p-3 bg-blue-50 text-blue-900 font-bold hover:bg-blue-100 transition-colors">
            📥 Export Data (CSV)
          </button>
          <button className="w-full border-3 border-green-600 rounded-lg p-3 bg-green-50 text-green-900 font-bold hover:bg-green-100 transition-colors">
            📤 Import Data
          </button>
          <button 
            onClick={handleClearAll}
            className="w-full border-3 border-red-600 rounded-lg p-3 bg-red-50 text-red-900 font-bold hover:bg-red-100 transition-colors"
          >
            🗑️ Clear All Data
          </button>
        </div>
      </DashboardCard>

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={handleSave}
          className="flex-1 border-3 border-black rounded-xl p-4 bg-black text-white font-black text-lg hover:bg-gray-900 transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)]"
        >
          💾 Save Settings
        </button>
        <button 
          onClick={handleResetDefaults}
          className="flex-1 border-3 border-black rounded-xl p-4 bg-white text-black font-black text-lg hover:bg-gray-100 transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]"
        >
          ↺ Reset to Default
        </button>
      </div>
    </div>
  );
}
