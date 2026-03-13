'use client';

import React, { memo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NavbarComponent = memo(function Navbar() {
  const pathname = usePathname();

  const isActive = useCallback((path: string) => pathname === path, [pathname]);

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/expenses', label: 'Expenses' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/help', label: 'Help' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <nav className="border-b-4 border-black bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="font-black text-2xl tracking-tighter text-black">
            PennyWise
          </Link>
          
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 font-bold rounded-lg border-2 border-black transition-all ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-black hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu would go here */}
          <div className="md:hidden">
            <button className="border-2 border-black rounded-lg p-2 font-bold">☰</button>
          </div>
        </div>
      </div>
    </nav>
  );
});

export { NavbarComponent as Navbar };
