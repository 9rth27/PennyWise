'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Expense } from '@/components/expense-list';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const DEFAULT_MONTHLY_BUDGET = 10000;

type ExpenseRow = {
  id: string;
  category: string;
  amount: number;
  date: string;
  time: string;
  description: string | null;
};

function mapExpenseRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    category: row.category,
    amount: Number(row.amount),
    date: row.date,
    time: row.time,
    description: row.description || undefined,
  };
}

function sortExpenses(items: Expense[]) {
  return [...items].sort((first, second) => {
    const firstDate = new Date(`${first.date}T${first.time}`).getTime();
    const secondDate = new Date(`${second.date}T${second.time}`).getTime();
    return secondDate - firstDate;
  });
}

function createExpenseId() {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replace(/-/g, '');
    }

    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2, 12)}`;
}

function readBudget(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return amount;
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(DEFAULT_MONTHLY_BUDGET);

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  const loadExpenses = useCallback(async () => {
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setExpenses([]);
      setMonthlyBudget(DEFAULT_MONTHLY_BUDGET);
      return;
    }

    const [{ data: expensesRows, error: expensesError }, { data: settingsRow, error: settingsError }] = await Promise.all([
      supabase
        .from('expenses')
        .select('id, category, amount, date, time, description')
        .order('date', { ascending: false })
        .order('time', { ascending: false }),
      supabase
        .from('user_settings')
        .select('monthly_budget')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    if (expensesError) {
      console.error('[Supabase] Failed to load expenses');
      return;
    }

    const safeExpenses = Array.isArray(expensesRows)
      ? expensesRows.map((row) => mapExpenseRow(row as ExpenseRow))
      : [];

    setExpenses(sortExpenses(safeExpenses));

    const parsedBudget = readBudget((settingsRow as any)?.monthly_budget);

    if (!settingsError && settingsRow && parsedBudget !== null) {
      setMonthlyBudget(parsedBudget);
    } else {
      setMonthlyBudget(DEFAULT_MONTHLY_BUDGET);
    }
  }, [supabase]);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadExpenses();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadExpenses, supabase]);

  const addExpense = useCallback(async (expense: Expense) => {
    if (!expense || !expense.category || !expense.date || !expense.time) {
      toast.error('Invalid expense details.');
      return false;
    }

    if (!Number.isFinite(Number(expense.amount)) || Number(expense.amount) <= 0) {
      toast.error('Invalid expense amount.');
      return false;
    }

    if (!supabase) {
      toast.error('Database is not configured yet.');
      return false;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Please log in to add expenses.');
      return false;
    }

    const payload = {
      id: expense.id || createExpenseId(),
      user_id: user.id,
      category: String(expense.category).toLowerCase().trim(),
      amount: Number(expense.amount),
      date: expense.date,
      time: expense.time,
      description: expense.description || null,
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert(payload)
      .select('id, category, amount, date, time, description')
      .single();

    if (error || !data) {
      console.error('[Supabase] Failed to add expense');
      toast.error('Unable to save expense right now.');
      return false;
    }

    setExpenses((previous) => sortExpenses([mapExpenseRow(data as ExpenseRow), ...previous]));
    return true;
  }, [supabase]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!id) {
      return false;
    }

    if (!supabase) {
      toast.error('Database is not configured yet.');
      return false;
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Supabase] Failed to delete expense');
      toast.error('Unable to delete expense right now.');
      return false;
    }

    setExpenses((previous) => previous.filter((expense) => expense.id !== id));
    return true;
  }, [supabase]);

  const updateBudget = useCallback(async (amount: number) => {
    const parsedBudget = readBudget(amount);
    if (parsedBudget === null) {
      toast.error('Invalid budget amount.');
      return false;
    }

    if (!supabase) {
      toast.error('Database is not configured yet.');
      return false;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Please log in to update budget.');
      return false;
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: user.id,
          monthly_budget: parsedBudget,
        },
        {
          onConflict: 'user_id',
        },
      );

    if (error) {
      console.error('[Supabase] Failed to update budget');
      toast.error('Unable to update budget right now.');
      return false;
    }

    setMonthlyBudget(parsedBudget);
    return true;
  }, [supabase]);

  const clearData = useCallback(async () => {
    if (!supabase) {
      toast.error('Database is not configured yet.');
      return false;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Please log in to clear data.');
      return false;
    }

    const [clearExpensesResult, resetBudgetResult] = await Promise.all([
      supabase.from('expenses').delete().eq('user_id', user.id),
      supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            monthly_budget: DEFAULT_MONTHLY_BUDGET,
          },
          {
            onConflict: 'user_id',
          },
        ),
    ]);

    if (clearExpensesResult.error || resetBudgetResult.error) {
      console.error('[Supabase] Failed to clear data');
      toast.error('Unable to clear your data right now.');
      return false;
    }

    setExpenses([]);
    setMonthlyBudget(DEFAULT_MONTHLY_BUDGET);
    return true;
  }, [supabase]);

  return {
    expenses,
    monthlyBudget,
    addExpense,
    deleteExpense,
    updateBudget,
    clearData,
  };
}
