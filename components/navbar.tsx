'use client';

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const NavbarComponent = memo(function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  const isActive = useCallback((path: string) => pathname === path, [pathname]);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) {
        setAuthEmail(data.user?.email ?? null);
      }
    };

    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = useCallback(async () => {
    if (!supabase) {
      toast.error('Authentication is not configured yet.');
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message || 'Unable to log out right now.');
      return;
    }

    setIsMobileMenuOpen(false);
    toast.success('Logged out successfully.');
    router.push('/login');
    router.refresh();
  }, [router, supabase]);

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
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="font-black text-2xl tracking-tighter text-black">
            PennyWise
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2">
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
            
            <div className="flex items-center gap-3 border-l-2 border-black pl-6">
              {authEmail ? (
                <>
                  <span className="px-3 py-2 font-bold rounded-lg border-2 border-black bg-gray-50 text-black max-w-48 truncate" title={authEmail}>
                    {authEmail}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2 font-bold rounded-lg border-2 border-black bg-white text-black transition-all hover:bg-gray-50 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-5 py-2 font-bold rounded-lg border-2 border-black bg-white text-black transition-all hover:bg-gray-50 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="px-5 py-2 font-bold rounded-lg border-2 border-black bg-yellow-400 text-black transition-all hover:bg-yellow-300 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="border-2 border-black rounded-lg p-2 font-bold bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all outline-none"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? '✖' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t-4 border-black bg-white absolute w-full left-0 flex flex-col shadow-[0px_8px_0px_0px_rgba(0,0,0,1)] max-h-[calc(100vh-5rem)] overflow-y-auto z-40">
          <div className="flex flex-col p-4 gap-3 bg-gray-50/50">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 font-bold rounded-lg border-2 border-black transition-all ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          <div className="p-4 flex flex-col gap-3 bg-white border-t-2 border-black border-dashed">
            {authEmail ? (
              <>
                <div className="px-4 py-3 text-center font-bold rounded-lg border-2 border-black bg-gray-50 text-black truncate" title={authEmail}>
                  {authEmail}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-5 py-3 text-center font-bold rounded-lg border-2 border-black bg-white text-black transition-all hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-5 py-3 text-center font-bold rounded-lg border-2 border-black bg-white text-black transition-all hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-5 py-3 text-center font-bold rounded-lg border-2 border-black bg-yellow-400 text-black transition-all hover:bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
});

export { NavbarComponent as Navbar };
