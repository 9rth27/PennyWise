'use client';

import React, { memo } from 'react';
import { DashboardCard } from './dashboard-card';

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  time: string;
  description?: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  tea: '☕',
  lunch: '🍽️',
  auto: '🚕',
  groceries: '🛒',
  misc: '📦',
};

import { Trash2 } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  title?: string;
  showAll?: boolean;
  onDelete?: (id: string) => void;
}

const ExpenseListComponent = memo(function ExpenseList({ expenses, title = 'Recent Activity', showAll = false, onDelete }: ExpenseListProps) {
  const displayExpenses = showAll ? expenses : expenses.slice(0, 5);

  return (
    <DashboardCard title={title}>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {displayExpenses.length === 0 ? (
          <p className="text-gray-500 font-bold">No expenses recorded yet</p>
        ) : (
          displayExpenses.map((expense) => (
            <div key={expense.id} className="border-2 border-black rounded-lg p-3 flex items-center justify-between gap-3 bg-white hover:bg-gray-50 transition-colors group max-sm:flex-col max-sm:items-stretch">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-2xl">{CATEGORY_EMOJI[expense.category] || '📦'}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-black capitalize">{expense.category}</p>
                  <p className="text-xs text-gray-600">{expense.date} at {expense.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 max-sm:justify-between max-sm:w-full">
                <p className="font-black text-lg text-black">₹{expense.amount.toFixed(2)}</p>
                {onDelete && (
                  <button 
                    onClick={() => onDelete(expense.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                    title="Delete transaction"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardCard>
  );
});

export { ExpenseListComponent as ExpenseList };
