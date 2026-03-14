'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DashboardCard } from './dashboard-card';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  createDefaultQuickAddAmounts,
  normalizeQuickAddAmounts,
  type QuickAddAmounts,
  type QuickAddKey,
} from '@/lib/user-settings';

const QUICK_CATEGORIES: Array<{
  id: QuickAddKey;
  label: string;
  emoji: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  hoverColor: string;
}> = [
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
  const [amounts, setAmounts] = useState<QuickAddAmounts>(createDefaultQuickAddAmounts());

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadQuickAddAmounts = async () => {
      if (!supabase) {
        if (isActive) {
          setAmounts(createDefaultQuickAddAmounts());
        }
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isActive) {
        return;
      }

      if (!user) {
        setAmounts(createDefaultQuickAddAmounts());
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('quick_add_amounts')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isActive) {
        return;
      }

      if (error) {
        console.error('[Supabase] Failed to load quick add amounts');
        setAmounts(createDefaultQuickAddAmounts());
        return;
      }

      setAmounts(normalizeQuickAddAmounts(data?.quick_add_amounts));
    };

    void loadQuickAddAmounts();

    if (!supabase) {
      return () => {
        isActive = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadQuickAddAmounts();
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <DashboardCard title="Quick Add Expense">
      <div className="grid grid-cols-5 max-sm:grid-cols-2 gap-4 max-sm:gap-3">
        {QUICK_CATEGORIES.map((category, index) => (
          <button
            key={category.id}
            onClick={() => onAdd(category.id, amounts[category.id])}
            className={`border-3 ${category.borderColor} rounded-xl p-4 max-sm:p-3 ${category.bgColor} ${category.hoverColor} ${category.textColor} font-bold text-sm text-center transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center max-sm:min-h-32 ${index === 4 ? 'max-sm:col-span-2' : ''}`}
          >
            <div className="text-3xl max-sm:text-2xl mb-2">{category.emoji}</div>
            <div className="font-bold text-sm max-sm:text-xs">{category.label}</div>
            <div className="mt-1 font-black text-sm">₹{amounts[category.id]}</div>
          </button>
        ))}
      </div>
    </DashboardCard>
  );
}
