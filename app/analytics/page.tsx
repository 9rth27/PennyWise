'use client';

import React, { useMemo } from 'react';
import { ExpenseCharts } from '@/components/expense-charts';
import { DashboardCard } from '@/components/dashboard-card';
import { Expense } from '@/components/expense-list';
import { AIInsights } from '@/components/ai-insights';

import { useExpenses } from '@/hooks/use-expenses';

export default function AnalyticsPage() {
  const { expenses, monthlyBudget } = useExpenses();

  // Memoize all calculations
  const { totalSpent, categoryStats, topCategory, avgDailySpending } = useMemo(() => {
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const categoryStats = expenses.reduce(
      (acc, expense) => {
        const category = expense.category.toLowerCase().trim();
        const existing = acc.find((item) => item.category === category);
        if (existing) {
          existing.total += expense.amount;
          existing.count += 1;
        } else {
          acc.push({
            category: category,
            total: expense.amount,
            count: 1,
          });
        }
        return acc;
      },
      [] as Array<{ category: string; total: number; count: number }>
    );

    const topCategory = categoryStats.length > 0 
      ? categoryStats.reduce((max, current) => (current.total > max.total ? current : max))
      : null;

    const avgDailySpending = totalSpent / 15; // approximate days

    return { totalSpent, categoryStats, topCategory, avgDailySpending };
  }, [expenses]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-4 border-black rounded-xl p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="font-black text-4xl mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600 font-bold text-lg">Detailed insights into your spending</p>
      </div>

      {/* AI Recommendations */}
      <AIInsights 
        monthlyBudget={monthlyBudget}
        monthlySpent={totalSpent}
        topCategory={topCategory?.category || ''}
        avgDailySpending={avgDailySpending}
        expenses={expenses}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Total Spent">
          <p className="text-3xl font-black text-black">₹{totalSpent.toFixed(2)}</p>
          <p className="text-xs text-gray-600 font-bold mt-2">Last 15 days</p>
        </DashboardCard>
        <DashboardCard title="Transactions">
          <p className="text-3xl font-black text-black">{expenses.length}</p>
          <p className="text-xs text-gray-600 font-bold mt-2">Total count</p>
        </DashboardCard>
        <DashboardCard title="Avg Daily Spend">
          <p className="text-3xl font-black text-black">₹{avgDailySpending.toFixed(2)}</p>
          <p className="text-xs text-gray-600 font-bold mt-2">Per day</p>
        </DashboardCard>
        <DashboardCard title="Top Category">
          <p className="text-2xl font-black text-black capitalize">{topCategory?.category || 'N/A'}</p>
          <p className="text-xs text-gray-600 font-bold mt-2">₹{topCategory?.total.toFixed(2) || '0'}</p>
        </DashboardCard>
      </div>

      {/* Charts */}
      <ExpenseCharts expenses={expenses} />
    </div>
  );
}
