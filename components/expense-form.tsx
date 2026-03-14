'use client';

import React, { useState } from 'react';
import { DashboardCard } from './dashboard-card';

const CATEGORIES = [
  { id: 'tea', label: 'Tea/Coffee' },
  { id: 'lunch', label: 'Lunch/Dinner' },
  { id: 'auto', label: 'Auto/Cab' },
  { id: 'groceries', label: 'Groceries' },
  { id: 'misc', label: 'Misc' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'health', label: 'Health' },
];

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'debit_card', label: 'Debit Card' },
  { id: 'credit_card', label: 'Credit Card' },
  { id: 'upi', label: 'UPI' },
  { id: 'wallet', label: 'Digital Wallet' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
];

interface ExpenseFormProps {
  onSubmit: (data: { category: string; amount: number; description?: string; paymentMethod?: string }) => void | Promise<void>;
}

export function ExpenseForm({ onSubmit }: ExpenseFormProps) {
  const [category, setCategory] = useState('misc');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        category,
        amount: parseFloat(amount),
        description,
        paymentMethod,
      });
      setAmount('');
      setDescription('');
      setCategory('misc');
      setPaymentMethod('cash');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardCard title="Add New Expense" className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-bold text-sm mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border-2 border-black rounded-lg p-3 font-bold bg-white text-black"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-sm mb-2">Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full border-2 border-black rounded-lg p-3 font-bold bg-white text-black placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block font-bold text-sm mb-2">Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add notes..."
            className="w-full border-2 border-black rounded-lg p-3 font-bold bg-white text-black placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block font-bold text-sm mb-2">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full border-2 border-black rounded-lg p-3 font-bold bg-white text-black focus:border-black focus:outline-none focus:ring-0"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method.id} value={method.id}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full border-3 border-black rounded-lg p-4 bg-black text-white font-black text-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </DashboardCard>
  );
}
