'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Expense } from '@/components/expense-list';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const DEFAULT_MONTHLY_BUDGET = 10000;

type ExpenseRow = {
  id: string;
  category: string;
  amount: number;
  name?: string | null;
  date: string;
  time: string;
  description: string | null;
  payment_method?: string | null;
};

type SupabaseQueryError = {
  code?: string;
  message?: string;
};

function isMissingSchemaError(error?: SupabaseQueryError | null) {
  if (!error) {
    return false;
  }

  return error.code === '42P01' || error.code === 'PGRST205';
}

function isMissingColumnError(error?: SupabaseQueryError | null) {
  if (!error) {
    return false;
  }

  return error.code === '42703';
}

function mapExpenseRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    category: row.category,
    amount: Number(row.amount),
    name: row.name?.trim() || undefined,
    date: row.date,
    time: row.time,
    description: row.description || undefined,
    paymentMethod: row.payment_method || undefined,
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
  const hasShownSchemaHintRef = useRef(false);

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

    const buildExpensesQuery = (columns: string) =>
      supabase
        .from('expenses')
        .select(columns)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

    const [{ data: expensesRowsWithName, error: expensesErrorWithName }, { data: settingsRow, error: settingsError }] = await Promise.all([
      buildExpensesQuery('id, category, amount, name, date, time, description, payment_method'),
      supabase
        .from('user_settings')
        .select('monthly_budget')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    let expensesRows = expensesRowsWithName;
    let expensesError = expensesErrorWithName;

    if (expensesErrorWithName && isMissingColumnError(expensesErrorWithName)) {
      const { data: rowsWithoutName, error: errorWithoutName } = await buildExpensesQuery(
        'id, category, amount, date, time, description, payment_method',
      );

      expensesRows = rowsWithoutName;
      expensesError = errorWithoutName;

      if (errorWithoutName && isMissingColumnError(errorWithoutName)) {
        const { data: legacyRows, error: legacyError } = await buildExpensesQuery('id, category, amount, date, time, description');
        expensesRows = legacyRows;
        expensesError = legacyError;
      }
    }

    if (expensesError) {
      if (isMissingSchemaError(expensesError) && !hasShownSchemaHintRef.current) {
        hasShownSchemaHintRef.current = true;
        toast.error('Database schema is missing. Run supabase/schema.sql in Supabase SQL Editor.');
      } else {
        console.warn('[Supabase] Failed to load expenses', expensesError);
      }

      return;
    }

    const safeExpenses = Array.isArray(expensesRows)
      ? expensesRows.map((row) => mapExpenseRow(row as unknown as ExpenseRow))
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
      name: expense.name?.trim() || null,
      date: expense.date,
      time: expense.time,
      description: expense.description || null,
      payment_method: expense.paymentMethod || null,
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert(payload)
      .select('id, category, amount, name, date, time, description, payment_method')
      .single();

    if (error && isMissingColumnError(error)) {
      const fallbackWithoutName = {
        id: payload.id,
        user_id: payload.user_id,
        category: payload.category,
        amount: payload.amount,
        date: payload.date,
        time: payload.time,
        description: payload.description,
        payment_method: payload.payment_method,
      };

      const { data: dataWithoutName, error: errorWithoutName } = await supabase
        .from('expenses')
        .insert(fallbackWithoutName)
        .select('id, category, amount, date, time, description, payment_method')
        .single();

      if (!errorWithoutName && dataWithoutName) {
        setExpenses((previous) => sortExpenses([mapExpenseRow(dataWithoutName as ExpenseRow), ...previous]));
        return true;
      }

      const legacyPayload = {
        id: payload.id,
        user_id: payload.user_id,
        category: payload.category,
        amount: payload.amount,
        date: payload.date,
        time: payload.time,
        description: payload.description,
      };

      const { data: legacyData, error: legacyError } = await supabase
        .from('expenses')
        .insert(legacyPayload)
        .select('id, category, amount, date, time, description')
        .single();

      if (legacyError || !legacyData) {
        if (isMissingSchemaError(legacyError) && !hasShownSchemaHintRef.current) {
          hasShownSchemaHintRef.current = true;
          toast.error('Database schema is missing. Run supabase/schema.sql in Supabase SQL Editor.');
        } else {
          console.warn('[Supabase] Failed to add expense', errorWithoutName || legacyError);
        }

        toast.error('Unable to save expense right now.');
        return false;
      }

      setExpenses((previous) => sortExpenses([mapExpenseRow(legacyData as ExpenseRow), ...previous]));
      return true;
    }

    if (error || !data) {
      if (isMissingSchemaError(error) && !hasShownSchemaHintRef.current) {
        hasShownSchemaHintRef.current = true;
        toast.error('Database schema is missing. Run supabase/schema.sql in Supabase SQL Editor.');
      } else {
        console.warn('[Supabase] Failed to add expense', error);
      }

      toast.error('Unable to save expense right now.');
      return false;
    }

    setExpenses((previous) => sortExpenses([mapExpenseRow(data as ExpenseRow), ...previous]));
    return true;
  }, [supabase]);

  const updateExpense = useCallback(async (
    id: string,
    updates: Partial<Pick<Expense, 'category' | 'amount' | 'name' | 'date' | 'time' | 'description' | 'paymentMethod'>>,
  ) => {
    if (!id || !updates || Object.keys(updates).length === 0) {
      return false;
    }

    if (!supabase) {
      toast.error('Database is not configured yet.');
      return false;
    }

    const payload: Record<string, unknown> = {};

    if (typeof updates.category === 'string' && updates.category.trim()) {
      payload.category = updates.category.toLowerCase().trim();
    }

    if (updates.amount !== undefined) {
      const parsedAmount = Number(updates.amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        toast.error('Invalid expense amount.');
        return false;
      }
      payload.amount = parsedAmount;
    }

    if (updates.name !== undefined) {
      payload.name = updates.name?.trim() || null;
    }

    if (typeof updates.date === 'string' && updates.date) {
      payload.date = updates.date;
    }

    if (typeof updates.time === 'string' && updates.time) {
      payload.time = updates.time;
    }

    if (updates.description !== undefined) {
      payload.description = updates.description || null;
    }

    if (updates.paymentMethod !== undefined) {
      payload.payment_method = updates.paymentMethod || null;
    }

    if (Object.keys(payload).length === 0) {
      return false;
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(payload)
      .eq('id', id)
      .select('id, category, amount, name, date, time, description, payment_method')
      .single();

    if (error && isMissingColumnError(error)) {
      const payloadWithoutName = {
        category: payload.category,
        amount: payload.amount,
        date: payload.date,
        time: payload.time,
        description: payload.description,
        payment_method: payload.payment_method,
      };

      const { data: dataWithoutName, error: errorWithoutName } = await supabase
        .from('expenses')
        .update(payloadWithoutName)
        .eq('id', id)
        .select('id, category, amount, date, time, description, payment_method')
        .single();

      if (!errorWithoutName && dataWithoutName) {
        setExpenses((previous) =>
          sortExpenses(previous.map((expense) => (expense.id === id ? mapExpenseRow(dataWithoutName as ExpenseRow) : expense))),
        );

        return true;
      }

      const legacyPayload = {
        category: payload.category,
        amount: payload.amount,
        date: payload.date,
        time: payload.time,
        description: payload.description,
      };

      const { data: legacyData, error: legacyError } = await supabase
        .from('expenses')
        .update(legacyPayload)
        .eq('id', id)
        .select('id, category, amount, date, time, description')
        .single();

      if (legacyError || !legacyData) {
        if (isMissingSchemaError(legacyError) && !hasShownSchemaHintRef.current) {
          hasShownSchemaHintRef.current = true;
          toast.error('Database schema is missing. Run supabase/schema.sql in Supabase SQL Editor.');
        } else {
          console.warn('[Supabase] Failed to update expense', errorWithoutName || legacyError);
        }

        toast.error('Unable to update expense right now.');
        return false;
      }

      setExpenses((previous) =>
        sortExpenses(previous.map((expense) => (expense.id === id ? mapExpenseRow(legacyData as ExpenseRow) : expense))),
      );

      return true;
    }

    if (error || !data) {
      if (isMissingSchemaError(error) && !hasShownSchemaHintRef.current) {
        hasShownSchemaHintRef.current = true;
        toast.error('Database schema is missing. Run supabase/schema.sql in Supabase SQL Editor.');
      } else {
        console.warn('[Supabase] Failed to update expense', error);
      }

      toast.error('Unable to update expense right now.');
      return false;
    }

    setExpenses((previous) =>
      sortExpenses(previous.map((expense) => (expense.id === id ? mapExpenseRow(data as ExpenseRow) : expense))),
    );

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
      if (isMissingSchemaError(error) && !hasShownSchemaHintRef.current) {
        hasShownSchemaHintRef.current = true;
        toast.error('Database schema is missing. Run supabase/schema.sql in Supabase SQL Editor.');
      } else {
        console.warn('[Supabase] Failed to delete expense', error);
      }

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
      if (isMissingSchemaError(error) && !hasShownSchemaHintRef.current) {
        hasShownSchemaHintRef.current = true;
        toast.error('Database schema is missing. Run supabase/schema.sql in Supabase SQL Editor.');
      } else {
        console.warn('[Supabase] Failed to update budget', error);
      }

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
      const maybeError = clearExpensesResult.error || resetBudgetResult.error;
      if (isMissingSchemaError(maybeError) && !hasShownSchemaHintRef.current) {
        hasShownSchemaHintRef.current = true;
        toast.error('Database schema is missing. Run supabase/schema.sql in Supabase SQL Editor.');
      } else {
        console.warn('[Supabase] Failed to clear data', maybeError);
      }

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
    updateExpense,
    deleteExpense,
    updateBudget,
    clearData,
  };
}
