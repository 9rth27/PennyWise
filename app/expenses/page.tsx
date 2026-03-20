'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ExpenseList, Expense } from '@/components/expense-list';
import { DashboardCard } from '@/components/dashboard-card';
import { toast } from 'sonner';

import { useExpenses } from '@/hooks/use-expenses';
import { useUserSettings } from '@/hooks/use-user-settings';

export default function ExpensesPage() {
  const { expenses, deleteExpense } = useExpenses();
  const { settings } = useUserSettings();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(
    () => [
      { id: 'all', label: 'All Categories' },
      ...settings.customCategories.map((category) => ({
        id: category.id,
        label: category.label,
      })),
    ],
    [settings.customCategories],
  );

  useEffect(() => {
    if (selectedCategory !== 'all' && !categories.some((category) => category.id === selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categories, selectedCategory]);

  const { filteredExpenses, totalSpent, averageExpense } = useMemo(() => {
    const filteredExpenses = selectedCategory === 'all' 
      ? expenses 
      : expenses.filter((e) => e.category === selectedCategory);

    const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const averageExpense = filteredExpenses.length > 0 ? totalSpent / filteredExpenses.length : 0;
    
    return { filteredExpenses, totalSpent, averageExpense };
  }, [selectedCategory, expenses]);

  const handleDelete = useCallback(async (id: string) => {
    const isDeleted = await deleteExpense(id);
    if (isDeleted) {
      toast.error('Transaction deleted');
    }
  }, [deleteExpense]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-4 border-black rounded-xl p-8 max-sm:p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="font-black text-4xl max-sm:text-3xl mb-2">All Expenses</h1>
        <p className="text-gray-600 font-bold text-lg max-sm:text-base">View and filter all your transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard title="Total Spent">
          <p className="text-4xl max-sm:text-3xl font-black text-black break-words">₹{totalSpent.toFixed(2)}</p>
        </DashboardCard>
        <DashboardCard title="Transactions">
          <p className="text-4xl max-sm:text-3xl font-black text-black">{filteredExpenses.length}</p>
        </DashboardCard>
        <DashboardCard title="Average Expense">
          <p className="text-4xl max-sm:text-3xl font-black text-black break-words">₹{averageExpense.toFixed(2)}</p>
        </DashboardCard>
      </div>

      {/* Filter */}
      <DashboardCard title="Filter by Category">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`w-full sm:w-auto px-4 py-2 font-bold rounded-lg border-2 border-black transition-colors capitalize ${
                selectedCategory === category.id
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </DashboardCard>

      {/* Expense List */}
      <ExpenseList expenses={filteredExpenses} title="Transaction History" showAll={true} onDelete={handleDelete} />
    </div>
  );
}
