'use client';

import React, { useState } from 'react';
import { ExpenseForm } from '@/components/expense-form';
import { DashboardCard } from '@/components/dashboard-card';
import { createExpenseId, useExpenses } from '@/hooks/use-expenses';
import { useUserSettings } from '@/hooks/use-user-settings';
import { formatCurrencyAmount } from '@/lib/display-format';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function AddExpensePage() {
  const { addExpense } = useExpenses();
  const { settings } = useUserSettings();
  const router = useRouter();

  const handleSubmit = async (data: { category: string; amount: number; name?: string; description?: string; paymentMethod?: string }) => {
    const now = new Date();

    const newExpense = {
      id: createExpenseId(),
      ...data,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 8),
    };
    
    const isAdded = await addExpense(newExpense);
    if (!isAdded) {
      return;
    }

    toast.success(`✓ Expense of ${formatCurrencyAmount(data.amount, settings.currency, settings.decimalPlaces)} added to ${data.category}`, {
      duration: 3000,
    });
    
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-4 border-black rounded-xl p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="font-black text-4xl mb-2">Add New Expense</h1>
        <p className="text-gray-600 font-bold text-lg">Quickly record a new expense transaction</p>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <ExpenseForm onSubmit={handleSubmit} />
        </div>

        {/* Quick Tips */}
        <div>
          <DashboardCard title="Quick Tips">
            <div className="space-y-3">
              <div className="border-2 border-black rounded-lg p-3 bg-gray-50">
                <p className="font-bold text-sm text-black mb-1">Choose the Right Category</p>
                <p className="text-xs text-gray-600">Select a category that best matches your expense for better analytics.</p>
              </div>
              <div className="border-2 border-black rounded-lg p-3 bg-gray-50">
                <p className="font-bold text-sm text-black mb-1">Add Notes</p>
                <p className="text-xs text-gray-600">Use the description field to add details about your expense.</p>
              </div>
              <div className="border-2 border-black rounded-lg p-3 bg-gray-50">
                <p className="font-bold text-sm text-black mb-1">Review Analytics</p>
                <p className="text-xs text-gray-600">Check the Analytics page to see spending patterns and trends.</p>
              </div>
              <div className="border-2 border-black rounded-lg p-3 bg-gray-50">
                <p className="font-bold text-sm text-black mb-1">Set a Budget</p>
                <p className="text-xs text-gray-600">Monitor your spending against your monthly budget on the dashboard.</p>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>


    </div>
  );
}
