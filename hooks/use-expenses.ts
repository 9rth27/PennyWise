'use client';

import { useState, useCallback, useMemo } from 'react';
import { Expense } from '@/components/expense-list';
import { validateBudget, validateExpense, generateSecureId } from '@/lib/security';

const STORAGE_KEY = 'pennywise_expenses';
const BUDGET_KEY = 'pennywise_budget';

// Initialize data synchronously from localStorage with validation
let initialExpenses: Expense[] = [];
let initialBudget: number = 10000;

if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate that it's an array with valid expenses
      initialExpenses = Array.isArray(parsed) 
        ? parsed.filter((e: any) => validateExpense(e))
        : [];
    }
  } catch (e) {
    console.error('[Security] Failed to parse expenses');
    initialExpenses = [];
  }

  try {
    const saved = localStorage.getItem(BUDGET_KEY);
    if (saved && validateBudget(saved)) {
      initialBudget = parseInt(saved);
    }
  } catch (e) {
    console.error('[Security] Failed to parse budget');
    initialBudget = 10000;
  }
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(initialBudget);

  const addExpense = useCallback((expense: Expense) => {
    // Validate expense before storing
    if (!validateExpense(expense)) {
      console.error('[Security] Invalid expense rejected');
      return;
    }

    // Ensure ID is not predictable
    const validExpense = {
      ...expense,
      id: expense.id || generateSecureId(),
    };

    setExpenses(prev => {
      const updated = [validExpense, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('[Security] Storage error');
      }
      return updated;
    });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    // Validate ID format to prevent injection
    if (typeof id !== 'string' || id.length < 8 || id.length > 64) {
      console.error('[Security] Invalid ID format');
      return;
    }

    setExpenses(prev => {
      const updated = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('[Security] Storage error');
      }
      return updated;
    });
  }, []);

  const updateBudget = useCallback((amount: number) => {
    if (!validateBudget(amount)) {
      console.error('[Security] Invalid budget amount');
      return;
    }

    setMonthlyBudget(amount);
    try {
      localStorage.setItem(BUDGET_KEY, amount.toString());
    } catch (e) {
      console.error('[Security] Storage error');
    }
  }, []);

  const clearData = useCallback(() => {
    setExpenses([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BUDGET_KEY);
    } catch (e) {
      console.error('[Security] Storage error');
    }
  }, []);

  return {
    expenses,
    monthlyBudget,
    addExpense,
    deleteExpense,
    updateBudget,
    clearData,
  };
}
