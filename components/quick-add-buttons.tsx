'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { DashboardCard } from './dashboard-card';

const DEFAULT_AMOUNTS: Record<string, number> = {
  tea: 50,
  lunch: 200,
  auto: 150,
  groceries: 500,
  misc: 100,
};

// Initialize quick add amounts synchronously
let initialQuickAddAmounts: Record<string, number> = DEFAULT_AMOUNTS;

if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('quickAddAmounts');
    if (saved) {
      initialQuickAddAmounts = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse quick add amounts', e);
    initialQuickAddAmounts = DEFAULT_AMOUNTS;
  }
}

const QUICK_CATEGORIES = [
  { id: 'tea', label: 'Tea/Coffee', emoji: '☕', bgColor: 'bg-gradient-to-br from-amber-400 to-orange-500', borderColor: 'border-black', textColor: 'text-white', hoverColor: 'hover:opacity-90' },
  { id: 'lunch', label: 'Lunch/Dinner', emoji: '🍽️', bgColor: 'bg-gradient-to-br from-pink-500 to-purple-600', borderColor: 'border-black', textColor: 'text-white', hoverColor: 'hover:opacity-90' },
  { id: 'auto', label: 'Auto/Cab', emoji: '🚕', bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600', borderColor: 'border-black', textColor: 'text-white', hoverColor: 'hover:opacity-90' },
  { id: 'groceries', label: 'Groceries', emoji: '🛒', bgColor: 'bg-gradient-to-br from-green-400 to-emerald-600', borderColor: 'border-black', textColor: 'text-white', hoverColor: 'hover:opacity-90' },
  { id: 'misc', label: 'Misc', emoji: '📦', bgColor: 'bg-gradient-to-br from-gray-700 to-black', borderColor: 'border-black', textColor: 'text-white', hoverColor: 'hover:opacity-90' },
];

interface QuickAddButtonsProps {
  onAdd: (category: string, amount: number) => void;
}

export function QuickAddButtons({ onAdd }: QuickAddButtonsProps) {
  const [amounts, setAmounts] = useState<Record<string, number>>(initialQuickAddAmounts);

  return (
    <DashboardCard title="Quick Add Expense">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {QUICK_CATEGORIES.map((category, index) => (
          <button
            key={category.id}
            onClick={() => onAdd(category.id, amounts[category.id] || DEFAULT_AMOUNTS[category.id])}
            className={`border-3 ${category.borderColor} rounded-xl p-3 sm:p-4 ${category.bgColor} ${category.hoverColor} ${category.textColor} font-bold text-sm text-center transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center min-h-32 sm:min-h-36 ${index === 4 ? 'col-span-2 sm:col-span-1' : ''}`}
          >
            <div className="text-2xl sm:text-3xl mb-2">{category.emoji}</div>
            <div className="font-bold text-xs md:text-sm">{category.label}</div>
            <div className="mt-1 font-black text-sm">₹{amounts[category.id] || DEFAULT_AMOUNTS[category.id]}</div>
          </button>
        ))}
      </div>
    </DashboardCard>
  );
}
