'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { QuickAddButtons } from '@/components/quick-add-buttons';
import { TodaySnapshot } from '@/components/today-snapshot';
import { ExpenseList, Expense } from '@/components/expense-list';
import { DashboardCard } from '@/components/dashboard-card';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

import { createExpenseId, useExpenses } from '@/hooks/use-expenses';

function DashboardContent() {
  const { expenses, monthlyBudget, addExpense, deleteExpense } = useExpenses();
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [emailConfirmedShown, setEmailConfirmedShown] = useState(false);

  // Handle email confirmation toast
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('emailConfirmed') === 'true' && !emailConfirmedShown) {
      toast.success('✅ Email confirmed! You can now log in.');
      setEmailConfirmedShown(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [emailConfirmedShown]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        
        if (data.user) {
          setIsLoggedIn(true);
          // Get full name from user metadata - check multiple fields
          const fullName = 
            data.user.user_metadata?.full_name?.trim() ||
            data.user.user_metadata?.name?.trim() ||
            data.user.user_metadata?.given_name?.trim();
          
          console.log('User metadata:', data.user.user_metadata);
          console.log('Full name extracted:', fullName);
          console.log('User email:', data.user.email);
          
          // Fallback: extract name from email if no metadata name
          if (fullName) {
            setUserName(fullName);
          } else if (data.user.email) {
            const emailName = data.user.email.split('@')[0];
            const formattedName = emailName.split(/[._-]/).map(part => 
              part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            ).join(' ');
            console.log('Fallback name from email:', formattedName);
            setUserName(formattedName);
          } else {
            setUserName(null);
          }
        } else {
          setIsLoggedIn(false);
          setUserName(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setIsLoggedIn(false);
        setUserName(null);
      } finally {
        // Mark auth check as complete - now safe to show login message if needed
        setIsAuthChecking(false);
      }
    };

    fetchUserData();

    // Listen for auth changes
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log('Auth state changed:', _event);
        if (session?.user) {
          setIsLoggedIn(true);
          const fullName = 
            session.user.user_metadata?.full_name?.trim() ||
            session.user.user_metadata?.name?.trim() ||
            session.user.user_metadata?.given_name?.trim();
          console.log('Session user metadata:', session.user.user_metadata);
          console.log('Session full name:', fullName);
          
          // Fallback: extract name from email if no metadata name
          if (fullName) {
            setUserName(fullName);
          } else if (session.user.email) {
            const emailName = session.user.email.split('@')[0];
            const formattedName = emailName.split(/[._-]/).map(part => 
              part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            ).join(' ');
            console.log('Fallback name from email:', formattedName);
            setUserName(formattedName);
          } else {
            setUserName(null);
          }
        } else {
          setIsLoggedIn(false);
          setUserName(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Auth state listener error:', error);
      return undefined;
    }
  }, []);

  // Memoize all expensive calculations
  const { todayExpenses, totalTodaySpent, monthlyTotal, remainingBudget, topCategory } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayExpenses = expenses.filter((e) => e.date === today);
    const totalTodaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthlyTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remainingBudget = monthlyBudget - monthlyTotal;

    const categoryBreakdown = expenses.reduce((acc, expense) => {
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
    }, [] as Array<{ category: string; total: number; count: number }>);

    const topCategory = categoryBreakdown.length > 0 
      ? categoryBreakdown.reduce((max, current) => (current.total > max.total ? current : max))
      : null;

    return { todayExpenses, totalTodaySpent, monthlyTotal, remainingBudget, categoryBreakdown, topCategory };
  }, [expenses, monthlyBudget]);

  const handleQuickAdd = useCallback(async (category: string, amount: number) => {
    const now = new Date();

    const newExpense: Expense = {
      id: createExpenseId(),
      category,
      amount: amount,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 8),
    };
    
    const isAdded = await addExpense(newExpense);
    if (!isAdded) {
      return;
    }
    
    toast.success(`Added ₹${amount} for ${category}`, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: async () => {
          const isDeleted = await deleteExpense(newExpense.id);
          if (isDeleted) {
            toast.info('Transaction undone');
          }
        }
      }
    });
  }, [addExpense, deleteExpense]);

  const handleDelete = useCallback(async (id: string) => {
    const isDeleted = await deleteExpense(id);
    if (isDeleted) {
      toast.error('Transaction deleted');
    }
  }, [deleteExpense]);

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-4 border-black rounded-xl p-6 md:p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="font-black text-3xl md:text-4xl max-sm:text-2xl mb-2">{getGreeting()}, {userName || 'User'}!</h1>
          {!isAuthChecking && !isLoggedIn && (
            <p className="text-gray-600 font-bold text-base md:text-lg max-sm:text-sm max-w-2xl">Log in now to save your progress securely and access your expenses on every device</p>
          )}
        </div>
        <Link href="/add" className="w-full md:w-auto text-center border-3 border-black rounded-xl px-6 py-3 bg-black text-white font-black hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] whitespace-nowrap">
          + Add Expense
        </Link>
      </div>

      {/* Budget Overview */}
      <DashboardCard title="Monthly Budget Overview">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-4 border-black rounded-lg p-4 bg-gradient-to-br from-emerald-500 to-green-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-sm font-bold text-green-100 mb-1">BUDGET</p>
            <p className="text-3xl max-sm:text-2xl font-black text-white break-words">₹{monthlyBudget.toLocaleString()}</p>
          </div>
          <div className="border-4 border-black rounded-lg p-4 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-sm font-bold text-blue-100 mb-1">SPENT</p>
            <p className="text-3xl max-sm:text-2xl font-black text-white break-words">₹{monthlyTotal.toLocaleString()}</p>
          </div>
          <div className={`border-4 border-black rounded-lg p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${remainingBudget >= 0 ? 'bg-gradient-to-br from-purple-500 to-pink-600' : 'bg-gradient-to-br from-red-500 to-orange-600'}`}>
            <p className="text-sm font-bold text-white opacity-80 mb-1">REMAINING</p>
            <p className="text-3xl max-sm:text-2xl font-black text-white break-words">
              ₹{remainingBudget.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="mt-4 bg-gray-200 border-2 border-black rounded-lg h-3 overflow-hidden">
          <div
            className="bg-black h-full transition-all"
            style={{ width: `${Math.min((monthlyTotal / monthlyBudget) * 100, 100)}%` }}
          />
        </div>
      </DashboardCard>

      {/* Quick Add */}
      <QuickAddButtons onAdd={handleQuickAdd} />

      {/* Today's Snapshot */}
      <TodaySnapshot totalSpent={totalTodaySpent} transactionCount={todayExpenses.length} />

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DashboardCard title="Top Spending Category">
          <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-4">
            <div>
              <p className="text-sm text-gray-600 font-bold mb-1">Category</p>
              <p className="text-2xl max-sm:text-xl font-black text-black capitalize break-words">{topCategory?.category || 'N/A'}</p>
            </div>
            <div className="text-right max-sm:text-left">
              <p className="text-sm text-gray-600 font-bold mb-1">Total Spent</p>
              <p className="text-2xl max-sm:text-xl font-black text-black break-words">₹{topCategory?.total.toLocaleString() || '0'}</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="This Month's Performance">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-gray-600">Budget Usage</p>
              <p className="text-sm font-bold text-black">{Math.round((monthlyTotal / monthlyBudget) * 100)}%</p>
            </div>
            <div className="bg-gray-200 border-2 border-black rounded-lg h-4 overflow-hidden">
              <div
                className="bg-black h-full transition-all"
                style={{ width: `${Math.min((monthlyTotal / monthlyBudget) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 font-bold">
              {remainingBudget >= 0 ? `₹${remainingBudget.toLocaleString()} remaining` : `Exceeded by ₹${Math.abs(remainingBudget).toLocaleString()}`}
            </p>
          </div>
        </DashboardCard>
      </div>

      {/* Recent Activity */}
      <ExpenseList expenses={expenses} title="Recent Activity" onDelete={handleDelete} />

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Link href="/add" className="border-4 border-black rounded-xl p-4 md:p-6 bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] transition-all text-center font-bold text-sm md:text-base">
          ➕ Add Expense
        </Link>
        <Link href="/expenses" className="border-4 border-black rounded-xl p-4 md:p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] transition-all text-center font-bold text-sm md:text-base">
          📊 See All Expenses
        </Link>
        <Link href="/analytics" className="border-4 border-black rounded-xl p-4 md:p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] transition-all text-center font-bold text-sm md:text-base sm:col-span-2 md:col-span-1">
          📈 Full Analytics
        </Link>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(DashboardContent), { ssr: false });

