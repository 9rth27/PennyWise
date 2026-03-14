'use client';

import React, { useState, useEffect, memo } from 'react';
import { DashboardCard } from './dashboard-card';
import { Expense } from './expense-list';

interface AIInsightsProps {
  monthlyBudget: number;
  monthlySpent: number;
  topCategory: string;
  avgDailySpending: number;
  expenses?: Expense[];
}

interface Insight {
  type: 'alert' | 'warning' | 'success' | 'info';
  icon: string;
  title: string;
  message: string;
}

const AIInsightsComponent = memo(function AIInsights({ monthlyBudget, monthlySpent, topCategory, avgDailySpending, expenses }: AIInsightsProps) {
  const [aiInsights, setAiInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAIInsights() {
      if (!expenses || expenses.length === 0) return;

      setLoading(true);
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expenses, budget: monthlyBudget }),
        });

        if (response.ok) {
          const data = await response.json();
          setAiInsights(data);
        }
      } catch (error) {
        console.error('Failed to fetch AI insights:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAIInsights();
  }, [expenses, monthlyBudget]);

  const insights = aiInsights;

  const getInsightClass = (type: string) => {
    switch (type) {
      case 'alert':
        return 'border-black bg-gradient-to-br from-red-400 to-rose-500 text-white';
      case 'warning':
        return 'border-black bg-gradient-to-br from-amber-300 to-orange-400 text-black';
      case 'success':
        return 'border-black bg-gradient-to-br from-emerald-300 to-green-400 text-black';
      default:
        return 'border-black bg-gradient-to-br from-blue-400 to-indigo-500 text-white';
    }
  };

  return (
    <DashboardCard title="💡 AI-Powered Insights">
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-3 sm:gap-0 p-6 sm:p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <span className="ml-0 sm:ml-3 font-bold">Analyzing your expenses...</span>
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center p-8 text-gray-600">
            <p>Add expenses to get AI-powered insights</p>
          </div>
        ) : (
          insights.map((insight, idx) => (
            <div key={idx} className={`border-4 rounded-lg p-4 sm:p-5 ${getInsightClass(insight.type)} shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="text-2xl sm:text-3xl bg-white/20 rounded-full w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shadow-inner shrink-0">{insight.icon}</div>
                <div className="flex-1">
                  <p className="font-black text-lg sm:text-xl mb-1">{insight.title}</p>
                  <p className="font-bold opacity-90">{insight.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardCard>
  );
});

export { AIInsightsComponent as AIInsights };
