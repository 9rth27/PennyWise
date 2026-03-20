'use client';

import React, { useMemo, memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardCard } from './dashboard-card';
import { Expense } from './expense-list';
import { formatCurrencyAmount, formatDateValue } from '@/lib/display-format';

interface ExpenseChartsProps {
  expenses: Expense[];
  currency?: string;
  decimalPlaces?: number;
  dateFormat?: string;
}

const ExpenseChartsComponent = memo(function ExpenseCharts({
  expenses,
  currency = 'INR',
  decimalPlaces = 2,
  dateFormat = 'DD/MM/YYYY',
}: ExpenseChartsProps) {

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
    const aggregatedData = expenses.reduce(
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

    return aggregatedData.map((item) => ({
      ...item,
      displayDate: formatDateValue(item.date, dateFormat),
    }));
  }, [dateFormat, expenses]);

  return (
    <div className="space-y-6">


      <DashboardCard title="Daily Spending Trend">
        <div className="w-full h-80 max-sm:h-72 flex items-center justify-center">
          {dateData.length === 0 ? (
            <p className="text-gray-600 font-bold">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#000" />
                <XAxis dataKey="displayDate" />
                <YAxis tickFormatter={(value) => formatCurrencyAmount(value, currency, decimalPlaces)} />
                <Tooltip formatter={(value: number | string) => formatCurrencyAmount(value, currency, decimalPlaces)} />
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
              className="border-2 border-black rounded-lg p-3 flex items-center justify-between bg-white max-sm:flex-col max-sm:items-start max-sm:gap-2"
            >
              <div>
                <p className="font-bold text-black">{item.category}</p>
                <p className="text-sm text-gray-600">{item.count} transaction{item.count !== 1 ? 's' : ''}</p>
              </div>
              <p className="font-black text-lg max-sm:break-words">{formatCurrencyAmount(item.amount, currency, decimalPlaces)}</p>
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
});

export { ExpenseChartsComponent as ExpenseCharts };
