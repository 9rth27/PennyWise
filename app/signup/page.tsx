'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const hasTriggeredGoogleRef = useRef(false);

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  const buildOAuthRedirectTo = useCallback(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const next = searchParams.get('next') || '/';
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    callbackUrl.searchParams.set('next', next);
    return callbackUrl.toString();
  }, [searchParams]);

  const handleGoogleSignup = useCallback(async () => {
    if (!supabase) {
      toast.error('Authentication is not configured yet.');
      return;
    }

    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: buildOAuthRedirectTo(),
        },
      });

      if (error) {
        toast.error(error.message || 'Unable to continue with Google right now.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }, [buildOAuthRedirectTo, supabase]);

  useEffect(() => {
    const useGoogle = searchParams.get('provider') === 'google';
    if (!useGoogle || hasTriggeredGoogleRef.current) {
      return;
    }

    hasTriggeredGoogleRef.current = true;
    void handleGoogleSignup();
  }, [handleGoogleSignup, searchParams]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, []);

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      toast.error('Authentication is not configured yet.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
        },
      });

      if (error) {
        toast.error(error.message || 'Unable to create account right now.');
        return;
      }

      if (data.session) {
        toast.success('Account created successfully.');
        router.push('/');
        router.refresh();
        return;
      }

      toast.success('Account created. Please verify your email to continue.');
      router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-9.25rem)] bg-[#f3f4f6] flex items-center justify-center p-3 sm:p-4 rounded-3xl overflow-hidden">
      <div className="max-w-md w-full bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5">
        <div className="mb-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2 text-black">Create Account</h1>
          <p className="text-gray-600 font-medium">Join PennyWise to take control of your finances.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-3">
          <div className="space-y-2">
            <label className="font-bold text-black" htmlFor="name">Full Name</label>
            <input 
              id="name" 
              type="text" 
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              placeholder="John Doe" 
              required
              className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="font-bold text-black" htmlFor="email">Email</label>
            <input 
              id="email" 
              type="email" 
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com" 
              required
              className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <label className="font-bold text-black" htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="••••••••" 
              required
              minLength={8}
              className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all font-medium"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full py-3 px-4 bg-yellow-400 text-black font-black text-lg rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>

          <button
            type="button"
            onClick={() => {
              void handleGoogleSignup();
            }}
            disabled={isLoading || isGoogleLoading}
            className="w-full py-3 px-4 bg-white text-black font-black text-lg rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center justify-center gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border-2 border-black bg-yellow-300 text-sm font-black leading-none">G</span>
              {isGoogleLoading ? 'Redirecting...' : 'Continue with Google'}
            </span>
          </button>
        </form>

        <div className="mt-4 text-center border-t-2 border-gray-100 pt-3">
          <p className="text-gray-600 font-bold">
            Already have an account?{' '}
            <Link href="/login" className="text-yellow-600 hover:text-yellow-800 underline decoration-2 underline-offset-4">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
