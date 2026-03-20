'use client';

import React, { memo, useMemo } from 'react';
import { DashboardCard } from './dashboard-card';
import { formatCurrencyAmount } from '@/lib/display-format';

interface TodaySnapshotProps {
  totalSpent: number;
  transactionCount: number;
  currency?: string;
  decimalPlaces?: number;
}

const TodaySnapshotComponent = memo(function TodaySnapshot({
  totalSpent,
  transactionCount,
  currency = 'INR',
  decimalPlaces = 2,
}: TodaySnapshotProps) {
  const average = useMemo(() => (transactionCount > 0 ? totalSpent / transactionCount : 0), [totalSpent, transactionCount]);

  return (
    <DashboardCard title="Today's Snapshot">
      <div className="space-y-4">
        <div className="border-4 border-black rounded-lg p-4 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold text-blue-100 mb-1">TOTAL SPENT TODAY</p>
          <p className="text-4xl max-sm:text-3xl font-black text-white break-words">{formatCurrencyAmount(totalSpent, currency, decimalPlaces)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="border-2 border-black rounded-lg p-3 bg-gray-50">
            <p className="text-xs font-bold text-gray-600">Transactions</p>
            <p className="text-2xl max-sm:text-xl font-black text-black">{transactionCount}</p>
          </div>
          <div className="border-2 border-black rounded-lg p-3 bg-gray-50">
            <p className="text-xs font-bold text-gray-600">Average</p>
            <p className="text-2xl max-sm:text-xl font-black text-black break-words">
              {formatCurrencyAmount(average, currency, decimalPlaces)}
            </p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
});

export { TodaySnapshotComponent as TodaySnapshot };
