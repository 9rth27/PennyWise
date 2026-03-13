'use client';

import React, { useMemo, memo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DashboardCard } from './dashboard-card';
import { Expense } from './expense-list';

interface ExpenseChartsProps {
  expenses: Expense[];
}

const ExpenseChartsComponent = memo(function ExpenseCharts({ expenses }: ExpenseChartsProps) {
  // Calculate spending by category
  const categoryData = useMemo(() => {
    return expenses.reduce(
      (acc, expense) => {
        const sanitizedCategory = expense.category.trim().toLowerCase();
        const displayCategory = sanitizedCategory.charAt(0).toUpperCase() + sanitizedCategory.slice(1);
        const existing = acc.find((item) => item.category === displayCategory);
        if (existing) {
          existing.amount += expense.amount;
          existing.count += 1;
        } else {
          acc.push({
            category: displayCategory,
            amount: expense.amount,
            count: 1,
          });
        }
        return acc;
      },
      [] as Array<{ category: string; amount: number; count: number }>
    );
  }, [expenses]);

  // Calculate spending by date
  const dateData = useMemo(() => {
    return expenses.reduce(
      (acc, expense) => {
        const existing = acc.find((item) => item.date === expense.date);
        if (existing) {
          existing.amount += expense.amount;
        } else {
          acc.push({
            date: expense.date,
            amount: expense.amount,
          });
        }
        return acc;
      },
      [] as Array<{ date: string; amount: number }>
    );
  }, [expenses]);

  const COLORS = ['#000000', '#444444', '#888888', '#CCCCCC', '#333333', '#666666', '#999999', '#BBBBBB'];

  return (
    <div className="space-y-6">


      <DashboardCard title="Daily Spending Trend">
        <div className="w-full h-80 flex items-center justify-center">
          {dateData.length === 0 ? (
            <p className="text-gray-600 font-bold">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#000" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: any) => `₹${value.toFixed(2)}`} />
                <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </DashboardCard>

      <DashboardCard title="Category Summary">
        <div className="space-y-2">
          {categoryData.map((item, index) => (
            <div
              key={index}
              className="border-2 border-black rounded-lg p-3 flex items-center justify-between bg-white"
            >
              <div>
                <p className="font-bold text-black">{item.category}</p>
                <p className="text-sm text-gray-600">{item.count} transaction{item.count !== 1 ? 's' : ''}</p>
              </div>
              <p className="font-black text-lg">₹{item.amount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
});

export { ExpenseChartsComponent as ExpenseCharts };
