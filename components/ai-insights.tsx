'use client';

import React, { useState, useEffect } from 'react';
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

export function AIInsights({ monthlyBudget, monthlySpent, topCategory, avgDailySpending, expenses }: AIInsightsProps) {
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

  const getLocalInsights = () => {
    const budgetUsagePercent = (monthlySpent / monthlyBudget) * 100;
    const projectedMonthlySpend = avgDailySpending * 30;
    const insights: Insight[] = [];

    if (budgetUsagePercent > 100) {
      insights.push({
        type: 'alert',
        icon: '⚠️',
        title: 'Over Budget',
        message: `You have exceeded your budget by ₹${(monthlySpent - monthlyBudget).toLocaleString()}.`,
      });
    } else if (budgetUsagePercent > 80) {
      insights.push({
        type: 'warning',
        icon: '⚡',
        title: 'Budget Warning',
        message: `You are using ${Math.round(budgetUsagePercent)}% of your budget. Be careful with spending.`,
      });
    } else {
      insights.push({
        type: 'success',
        icon: '✓',
        title: 'Budget on Track',
        message: `You are on track with your budget. Keep it up!`,
      });
    }

    if (projectedMonthlySpend > monthlyBudget) {
      insights.push({
        type: 'alert',
        icon: '📊',
        title: 'Projected Over Budget',
        message: `At your current spending rate (₹${avgDailySpending.toFixed(0)}/day), you will exceed budget by ₹${(projectedMonthlySpend - monthlyBudget).toLocaleString()}.`,
      });
    }

    return insights;
  };

  const insights = aiInsights.length > 0 ? aiInsights : getLocalInsights();

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
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <span className="ml-3 font-bold">Analyzing your expenses...</span>
          </div>
        ) : (
          insights.map((insight, idx) => (
            <div key={idx} className={`border-4 rounded-lg p-5 ${getInsightClass(insight.type)} shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}>
              <div className="flex gap-4">
                <div className="text-3xl bg-white/20 rounded-full w-12 h-12 flex items-center justify-center shadow-inner">{insight.icon}</div>
                <div className="flex-1">
                  <p className="font-black text-xl mb-1">{insight.title}</p>
                  <p className="font-bold opacity-90">{insight.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardCard>
  );
}
