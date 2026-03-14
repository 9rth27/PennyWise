'use client';

import React, { useState, useCallback } from 'react';
import { DashboardCard } from '@/components/dashboard-card';
import { useExpenses } from '@/hooks/use-expenses';
import { toast } from 'sonner';

// Initialize settings synchronously
let initialSettings = {
  monthlyBudget: 10000,
  currency: 'INR',
  theme: 'dark',
  notifications: true,
  emailAlerts: false,
  defaultCategory: 'misc',
  decimalPlaces: 2,
  dateFormat: 'DD/MM/YYYY',
};

let initialQuickAddAmounts: Record<string, number> = {
  tea: 50,
  lunch: 200,
  auto: 150,
  groceries: 500,
  misc: 100,
};

if (typeof window !== 'undefined') {
  try {
    const savedSettings = localStorage.getItem('pennywise_settings');
    if (savedSettings) {
      initialSettings = JSON.parse(savedSettings);
    }
  } catch (e) {
    console.error('Failed to parse settings', e);
  }

  try {
    const savedQuickAdd = localStorage.getItem('quickAddAmounts');
    if (savedQuickAdd) {
      initialQuickAddAmounts = JSON.parse(savedQuickAdd);
    }
  } catch (e) {
    console.error('Failed to parse quick add amounts', e);
  }
}

export default function SettingsPage() {
  const { monthlyBudget, updateBudget, clearData } = useExpenses();
  const [settings, setSettings] = useState(initialSettings);

  const [customCategories, setCustomCategories] = useState([
    { id: 'tea', label: 'Tea/Coffee', color: 'amber' },
    { id: 'lunch', label: 'Lunch/Dinner', color: 'orange' },
    { id: 'auto', label: 'Auto/Cab', color: 'blue' },
    { id: 'groceries', label: 'Groceries', color: 'green' },
    { id: 'misc', label: 'Misc', color: 'purple' },
  ]);

  const [newCategory, setNewCategory] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('red');
  const [quickAddAmounts, setQuickAddAmounts] = useState<Record<string, number>>(initialQuickAddAmounts);

  const handleSettingChange = useCallback((key: string, value: string | number | boolean) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      if (key === 'monthlyBudget') {
        void updateBudget(Number(value));
      }
      localStorage.setItem('pennywise_settings', JSON.stringify(newSettings));
      return newSettings;
    });
  }, [updateBudget]);

  const handleSave = useCallback(() => {
    localStorage.setItem('pennywise_settings', JSON.stringify(settings));
    toast.success('Settings saved successfully!');
  }, [settings]);

  const handleClearAll = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all transaction history? This cannot be undone.')) {
      const isCleared = await clearData();
      if (isCleared) {
        toast.info('All transaction data cleared');
      }
    }
  }, [clearData]);

  const addCustomCategory = useCallback(() => {
    if (newCategory.trim()) {
      const newCat = {
        id: newCategory.toLowerCase().replace(/\s+/g, '-'),
        label: newCategory,
        color: newCategoryColor,
      };
      setCustomCategories(prev => [...prev, newCat]);
      setNewCategory('');
      setNewCategoryColor('red');
    }
  }, [newCategory, newCategoryColor]);

  const removeCategory = (id: string) => {
    setCustomCategories(customCategories.filter((cat) => cat.id !== id));
  };

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
      <div className="border-4 border-black rounded-xl p-6 sm:p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="font-black text-3xl sm:text-4xl mb-2">Settings & Customizations</h1>
        <p className="text-gray-600 font-bold text-base sm:text-lg">Personalize your money tracking experience</p>
      </div>

      {/* Budget Settings */}
      <DashboardCard title="Budget Settings">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-black mb-2">Monthly Budget Limit</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="number"
                value={settings.monthlyBudget}
                onChange={(e) => handleSettingChange('monthlyBudget', parseInt(e.target.value))}
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-2 border-black rounded-lg p-4 bg-gray-50">
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

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-2 border-black rounded-lg p-4 bg-gray-50">
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
            {[
              { id: 'tea', label: 'Tea/Coffee', emoji: '☕' },
              { id: 'lunch', label: 'Lunch/Dinner', emoji: '🍽️' },
              { id: 'auto', label: 'Auto/Cab', emoji: '🚕' },
              { id: 'groceries', label: 'Groceries', emoji: '🛒' },
              { id: 'misc', label: 'Misc', emoji: '📦' },
            ].map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 border-2 border-black rounded-lg p-3 bg-gray-50">
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-black text-sm">{item.label}</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                  <span className="font-black">₹</span>
                  <input
                    type="number"
                    value={quickAddAmounts[item.id] || ''}
                    onChange={(e) => {
                      const newAmounts = { ...quickAddAmounts, [item.id]: parseInt(e.target.value) || 0 };
                      setQuickAddAmounts(newAmounts);
                      localStorage.setItem('quickAddAmounts', JSON.stringify(newAmounts));
                    }}
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
        <button className="flex-1 border-3 border-black rounded-xl p-4 bg-white text-black font-black text-lg hover:bg-gray-100 transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]">
          ↺ Reset to Default
        </button>
      </div>
    </div>
  );
}
