import React from 'react';
import { DashboardCard } from './dashboard-card';

interface TodaySnapshotProps {
  totalSpent: number;
  transactionCount: number;
}

export function TodaySnapshot({ totalSpent, transactionCount }: TodaySnapshotProps) {
  return (
    <DashboardCard title="Today's Snapshot">
      <div className="space-y-4">
        <div className="border-4 border-black rounded-lg p-4 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold text-blue-100 mb-1">TOTAL SPENT TODAY</p>
          <p className="text-4xl font-black text-white">₹{totalSpent.toFixed(2)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="border-2 border-black rounded-lg p-3 bg-gray-50">
            <p className="text-xs font-bold text-gray-600">Transactions</p>
            <p className="text-2xl font-black text-black">{transactionCount}</p>
          </div>
          <div className="border-2 border-black rounded-lg p-3 bg-gray-50">
            <p className="text-xs font-bold text-gray-600">Average</p>
            <p className="text-2xl font-black text-black">
              ₹{transactionCount > 0 ? (totalSpent / transactionCount).toFixed(0) : 0}
            </p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
