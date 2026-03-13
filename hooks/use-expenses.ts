'use client';

import { useState, useEffect } from 'react';
import { Expense } from '@/components/expense-list';

const STORAGE_KEY = 'pennywise_expenses';
const BUDGET_KEY = 'pennywise_budget';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(10000);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedExpenses = localStorage.getItem(STORAGE_KEY);
    const savedBudget = localStorage.getItem(BUDGET_KEY);
    
    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses));
      } catch (e) {
        console.error('Failed to parse expenses', e);
      }
    }
    
    if (savedBudget) {
      setMonthlyBudget(parseInt(savedBudget) || 10000);
    }
    
    setIsLoaded(true);
  }, []);

  const addExpense = (expense: Expense) => {
    const updated = [expense, ...expenses];
    setExpenses(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const updateBudget = (amount: number) => {
    setMonthlyBudget(amount);
    localStorage.setItem(BUDGET_KEY, amount.toString());
  };

  const clearData = () => {
    setExpenses([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    expenses,
    monthlyBudget,
    addExpense,
    deleteExpense,
    updateBudget,
    clearData,
    isLoaded,
  };
}
