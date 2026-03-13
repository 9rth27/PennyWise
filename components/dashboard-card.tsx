import React from 'react';

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function DashboardCard({ title, children, className = '' }: DashboardCardProps) {
  return (
    <div className={`border-4 border-black rounded-xl p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`}>
      <h3 className="font-black text-lg mb-4 text-black">{title}</h3>
      {children}
    </div>
  );
}
