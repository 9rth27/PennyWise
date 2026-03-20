'use client';

import React, { useState, useCallback, useRef } from 'react';
import { DashboardCard } from '@/components/dashboard-card';
import { createExpenseId, useExpenses } from '@/hooks/use-expenses';
import { useUserSettings } from '@/hooks/use-user-settings';
import { formatCurrencyAmount, getCurrencySymbol } from '@/lib/display-format';
import { toast } from 'sonner';

const CSV_HEADERS = ['id', 'category', 'amount', 'name', 'date', 'time', 'description', 'payment_method'];

function escapeCsvValue(value: unknown) {
  const safeValue = value === null || value === undefined ? '' : String(value);
  if (safeValue.includes(',') || safeValue.includes('"') || safeValue.includes('\n') || safeValue.includes('\r')) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }
  return safeValue;
}

function parseCsvRows(csvText: string) {
  const rows: string[][] = [];
  let currentValue = '';
  let currentRow: string[] = [];
  let insideQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (character === ',' && !insideQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !insideQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1;
      }

      currentRow.push(currentValue);
      currentValue = '';

      if (currentRow.some((value) => value.trim() !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      continue;
    }

    currentValue += character;
  }

  currentRow.push(currentValue);
  if (currentRow.some((value) => value.trim() !== '')) {
    rows.push(currentRow);
  }

  return rows;
}

function normalizeHeader(value: string) {
  return value.toLowerCase().trim().replace(/[\s_-]+/g, '');
}

function formatImportDate(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return new Date().toISOString().split('T')[0];
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  const slashDateMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashDateMatch) {
    const first = Number(slashDateMatch[1]);
    const second = Number(slashDateMatch[2]);
    const year = Number(slashDateMatch[3]);
    const month = first > 12 ? second : first;
    const day = first > 12 ? first : second;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const parsed = new Date(trimmedValue);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

function formatImportTime(value: string) {
  const trimmedValue = value.trim();
  const timeMatch = trimmedValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([aApP][mM]))?$/);

  if (timeMatch) {
    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const seconds = Number(timeMatch[3] || '0');
    const period = timeMatch[4]?.toLowerCase();

    if (period === 'pm' && hours < 12) {
      hours += 12;
    }
    if (period === 'am' && hours === 12) {
      hours = 0;
    }

    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  }

  return new Date().toTimeString().slice(0, 8);
}

export default function SettingsPage() {
  const { clearData, expenses, addExpense } = useExpenses();
  const { settings, setSetting, updateQuickAddAmount, addCustomCategory: createCustomCategory, removeCustomCategory, saveSettings, resetSettings } = useUserSettings();

  const [newCategory, setNewCategory] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('red');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const quickAddAmounts = settings.quickAddAmounts;
  const currencySymbol = getCurrencySymbol(settings.currency);
  const quickAddStep = settings.decimalPlaces === 0 ? '1' : settings.decimalPlaces === 1 ? '0.1' : '0.01';

  const handleSettingChange = useCallback(
    (key: 'monthlyBudget' | 'currency' | 'defaultCategory' | 'dateFormat' | 'decimalPlaces' | 'notifications' | 'emailAlerts', value: string | number | boolean) => {
      if (key === 'monthlyBudget') {
        setSetting('monthlyBudget', Number(value) > 0 ? Number(value) : 0);
        return;
      }

      if (key === 'decimalPlaces') {
        const parsedValue = Number(value);
        const nextDecimalPlaces = parsedValue >= 0 && parsedValue <= 2 ? parsedValue : 2;
        setSetting('decimalPlaces', nextDecimalPlaces);

        void (async () => {
          const isSaved = await saveSettings({
            ...settings,
            decimalPlaces: nextDecimalPlaces,
          });

          if (isSaved) {
            toast.success('Display preference saved for your account.');
          }
        })();

        return;
      }

      if (key === 'currency') {
        const nextCurrency = String(value);
        setSetting('currency', nextCurrency);

        void (async () => {
          const isSaved = await saveSettings({
            ...settings,
            currency: nextCurrency,
          });

          if (isSaved) {
            toast.success('Display preference saved for your account.');
          }
        })();

        return;
      }

      if (key === 'dateFormat') {
        const nextDateFormat = String(value);
        setSetting('dateFormat', nextDateFormat);

        void (async () => {
          const isSaved = await saveSettings({
            ...settings,
            dateFormat: nextDateFormat,
          });

          if (isSaved) {
            toast.success('Display preference saved for your account.');
          }
        })();

        return;
      }

      if (key === 'notifications' || key === 'emailAlerts') {
        setSetting(key, Boolean(value));
        return;
      }

      setSetting(key, String(value));
    },
    [saveSettings, setSetting, settings],
  );

  const handleSave = useCallback(() => {
    void (async () => {
      const isSaved = await saveSettings();
      if (isSaved) {
        toast.success('Settings saved successfully!');
      }
    })();
  }, [saveSettings]);

  const handleClearAll = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all transaction history? This cannot be undone.')) {
      const isCleared = await clearData();
      if (isCleared) {
        toast.info('All transaction data cleared');
      }
    }
  }, [clearData]);

  const handleAddCustomCategory = useCallback(() => {
    void (async () => {
      const trimmedCategory = newCategory.trim();
      if (!trimmedCategory) {
        return;
      }

      const categoryToAdd = {
        id: trimmedCategory.toLowerCase().replace(/\s+/g, '-'),
        label: trimmedCategory,
        color: newCategoryColor,
      };

      if (settings.customCategories.some((category) => category.id === categoryToAdd.id)) {
        toast.error('Category already exists.');
        return;
      }

      createCustomCategory(categoryToAdd);

      const isSaved = await saveSettings({
        ...settings,
        customCategories: [...settings.customCategories, categoryToAdd],
      });

      if (!isSaved) {
        removeCustomCategory(categoryToAdd.id);
        return;
      }

      setNewCategory('');
      setNewCategoryColor('red');
      toast.success('Category saved for your account.');
    })();
  }, [createCustomCategory, newCategory, newCategoryColor, removeCustomCategory, saveSettings, settings]);

  const removeCategory = (id: string) => {
    removeCustomCategory(id);
  };

  const handleResetDefaults = useCallback(() => {
    resetSettings();
    toast.info('Settings reset to defaults. Click Save Settings to persist changes.');
  }, [resetSettings]);

  const handleExportData = useCallback(() => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const csvRows = expenses.map((expense) => [
        expense.id,
        expense.category,
        String(expense.amount),
        expense.name || '',
        expense.date,
        expense.time,
        expense.description || '',
        expense.paymentMethod || '',
      ]);

      const csvContent = [
        CSV_HEADERS.join(','),
        ...csvRows.map((row) => row.map((value) => escapeCsvValue(value)).join(',')),
      ].join('\n');

      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStamp = new Date().toISOString().split('T')[0];

      link.href = url;
      link.download = `pennywise-expenses-${dateStamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (expenses.length === 0) {
        toast.info('No expenses yet. Exported a blank CSV template.');
        return;
      }

      toast.success(`Exported ${expenses.length} expense${expenses.length === 1 ? '' : 's'} to CSV.`);
    } catch {
      toast.error('Unable to export data right now.');
    } finally {
      setIsExporting(false);
    }
  }, [expenses, isExporting]);

  const handleImportButtonClick = useCallback(() => {
    if (isImporting) {
      return;
    }

    importFileInputRef.current?.click();
  }, [isImporting]);

  const handleImportFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file.');
      return;
    }

    setIsImporting(true);

    try {
      const csvText = await file.text();
      const rows = parseCsvRows(csvText);

      if (rows.length < 2) {
        toast.error('CSV file has no data rows to import.');
        return;
      }

      const headerRow = rows[0].map((value) => normalizeHeader(value));
      const getColumnIndex = (...aliases: string[]) => headerRow.findIndex((header) => aliases.includes(header));

      const categoryIndex = getColumnIndex('category');
      const amountIndex = getColumnIndex('amount');
      const nameIndex = getColumnIndex('name', 'title');
      const dateIndex = getColumnIndex('date', 'transactiondate');
      const timeIndex = getColumnIndex('time', 'transactiontime');
      const descriptionIndex = getColumnIndex('description', 'note', 'notes');
      const paymentMethodIndex = getColumnIndex('paymentmethod', 'paymentmode', 'method');

      if (categoryIndex < 0 || amountIndex < 0) {
        toast.error('CSV must include Category and Amount columns.');
        return;
      }

      let importedCount = 0;
      let skippedCount = 0;
      let stoppedOnSaveFailure = false;

      for (const row of rows.slice(1)) {
        if (!row || row.every((cell) => cell.trim() === '')) {
          continue;
        }

        const category = (row[categoryIndex] || '').trim();
        const amount = Number((row[amountIndex] || '').replace(/[^\d.-]/g, ''));

        if (!category || !Number.isFinite(amount) || amount <= 0) {
          skippedCount += 1;
          continue;
        }

        const date = dateIndex >= 0 ? formatImportDate(row[dateIndex] || '') : new Date().toISOString().split('T')[0];
        const time = timeIndex >= 0 ? formatImportTime(row[timeIndex] || '') : new Date().toTimeString().slice(0, 8);

        const isSaved = await addExpense({
          id: createExpenseId(),
          category,
          amount,
          date,
          time,
          name: nameIndex >= 0 ? (row[nameIndex] || '').trim() || undefined : undefined,
          description: descriptionIndex >= 0 ? (row[descriptionIndex] || '').trim() || undefined : undefined,
          paymentMethod: paymentMethodIndex >= 0 ? (row[paymentMethodIndex] || '').trim() || undefined : undefined,
        });

        if (!isSaved) {
          stoppedOnSaveFailure = true;
          break;
        }

        importedCount += 1;
      }

      if (stoppedOnSaveFailure) {
        toast.error('Import stopped because expenses could not be saved. Please try again.');
        return;
      }

      if (importedCount === 0) {
        toast.error(skippedCount > 0 ? 'No rows were imported. Please check your CSV values.' : 'No valid rows found to import.');
        return;
      }

      if (skippedCount > 0) {
        toast.info(`Imported ${importedCount} expense${importedCount === 1 ? '' : 's'} and skipped ${skippedCount} invalid row${skippedCount === 1 ? '' : 's'}.`);
        return;
      }

      toast.success(`Imported ${importedCount} expense${importedCount === 1 ? '' : 's'} successfully.`);
    } catch {
      toast.error('Unable to import CSV right now.');
    } finally {
      setIsImporting(false);
    }
  }, [addExpense]);

  const colorOptions = [
    { name: 'Red', value: 'red', bg: 'bg-red-100', border: 'border-red-600' },
    { name: 'Orange', value: 'orange', bg: 'bg-orange-100', border: 'border-orange-600' },
    { name: 'Amber', value: 'amber', bg: 'bg-amber-100', border: 'border-amber-600' },
    { name: 'Green', value: 'green', bg: 'bg-green-100', border: 'border-green-600' },
    { name: 'Blue', value: 'blue', bg: 'bg-blue-100', border: 'border-blue-600' },
    { name: 'Purple', value: 'purple', bg: 'bg-purple-100', border: 'border-purple-600' },
    { name: 'Pink', value: 'pink', bg: 'bg-pink-100', border: 'border-pink-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-4 border-black rounded-xl p-8 max-sm:p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="font-black text-4xl max-sm:text-3xl mb-2">Settings & Customizations</h1>
        <p className="text-gray-600 font-bold text-lg max-sm:text-base">Personalize your money tracking experience</p>
      </div>

      {/* Budget Settings */}
      <DashboardCard title="Budget Settings">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-black mb-2">Monthly Budget Limit</label>
            <div className="flex gap-2 items-center max-sm:flex-col max-sm:items-start">
              <input
                type="number"
                value={settings.monthlyBudget}
                onChange={(e) => handleSettingChange('monthlyBudget', parseInt(e.target.value, 10) || 0)}
                className="border border-black rounded-lg px-4 py-2 font-bold flex-1 focus:border-black focus:outline-none focus:ring-0"
              />
              <span className="font-bold text-lg">{currencySymbol}</span>
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
              {settings.customCategories.map((cat) => (
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
              onChange={(e) => handleSettingChange('currency', e.target.value)}
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
              onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
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
              onChange={(e) => handleSettingChange('decimalPlaces', parseInt(e.target.value, 10))}
              className="border border-black rounded-lg px-4 py-2 font-bold w-full focus:border-black focus:outline-none focus:ring-0"
            >
              <option value={0}>0 ({formatCurrencyAmount(1000, settings.currency, 0)})</option>
              <option value={1}>1 ({formatCurrencyAmount(1000, settings.currency, 1)})</option>
              <option value={2}>2 ({formatCurrencyAmount(1000, settings.currency, 2)})</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {/* Notification Settings */}
      <DashboardCard title="Notification Settings">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 border-2 border-black rounded-lg p-4 bg-gray-50 max-sm:flex-col max-sm:items-start">
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

          <div className="flex items-center justify-between gap-4 border-2 border-black rounded-lg p-4 bg-gray-50 max-sm:flex-col max-sm:items-start">
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
              {settings.customCategories.map((cat) => {
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
                <div className="grid grid-cols-4 gap-2 max-sm:grid-cols-2">
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
                onClick={handleAddCustomCategory}
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
            {[
              { id: 'tea', label: 'Tea/Coffee', emoji: '☕' },
              { id: 'lunch', label: 'Lunch/Dinner', emoji: '🍽️' },
              { id: 'auto', label: 'Auto/Cab', emoji: '🚕' },
              { id: 'groceries', label: 'Groceries', emoji: '🛒' },
              { id: 'misc', label: 'Misc', emoji: '📦' },
            ].map((item) => (
              <div key={item.id} className="flex items-center gap-3 border-2 border-black rounded-lg p-3 bg-gray-50 max-sm:flex-col max-sm:items-start">
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-black text-sm">{item.label}</p>
                </div>
                <div className="flex items-center gap-2 max-sm:w-full max-sm:justify-between">
                  <span className="font-black">{currencySymbol}</span>
                  <input
                    type="number"
                    step={quickAddStep}
                    value={quickAddAmounts[item.id] || ''}
                    onChange={(e) => {
                      updateQuickAddAmount(item.id, Number(e.target.value) || 0);
                    }}
                    className="border border-black rounded px-2 py-1 font-bold w-20 max-sm:w-24 focus:outline-none"
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
          <input
            ref={importFileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportFileChange}
            className="hidden"
          />
          <button
            onClick={handleExportData}
            disabled={isExporting || isImporting}
            className="w-full border-3 border-blue-600 rounded-lg p-3 bg-blue-50 text-blue-900 font-bold hover:bg-blue-100 transition-colors disabled:opacity-60"
          >
            {isExporting ? '⏳ Exporting CSV...' : '📥 Export Data (CSV)'}
          </button>
          <button
            onClick={handleImportButtonClick}
            disabled={isImporting || isExporting}
            className="w-full border-3 border-green-600 rounded-lg p-3 bg-green-50 text-green-900 font-bold hover:bg-green-100 transition-colors disabled:opacity-60"
          >
            {isImporting ? '⏳ Importing CSV...' : '📤 Import Data'}
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
      <div className="flex gap-4 max-sm:flex-col">
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
