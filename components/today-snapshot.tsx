import React, { memo, useMemo } from 'react';
import { DashboardCard } from './dashboard-card';

interface TodaySnapshotProps {
  totalSpent: number;
  transactionCount: number;
}

const TodaySnapshotComponent = memo(function TodaySnapshot({ totalSpent, transactionCount }: TodaySnapshotProps) {
  const average = useMemo(() => transactionCount > 0 ? (totalSpent / transactionCount).toFixed(0) : '0', [totalSpent, transactionCount]);

  return (
    <DashboardCard title="Today's Snapshot">
      <div className="space-y-4">
        <div className="border-4 border-black rounded-lg p-4 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold text-blue-100 mb-1">TOTAL SPENT TODAY</p>
          <p className="text-4xl max-sm:text-3xl font-black text-white break-words">₹{totalSpent.toFixed(2)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="border-2 border-black rounded-lg p-3 bg-gray-50">
            <p className="text-xs font-bold text-gray-600">Transactions</p>
            <p className="text-2xl max-sm:text-xl font-black text-black">{transactionCount}</p>
          </div>
          <div className="border-2 border-black rounded-lg p-3 bg-gray-50">
            <p className="text-xs font-bold text-gray-600">Average</p>
            <p className="text-2xl max-sm:text-xl font-black text-black break-words">
              ₹{average}
            </p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
});

export { TodaySnapshotComponent as TodaySnapshot };
