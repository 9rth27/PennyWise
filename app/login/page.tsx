'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/src/supabaseClient';
import { buildAuthCallbackUrl } from '@/lib/supabase/auth-redirect';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100dvh-9.25rem)] bg-[#f3f4f6] flex items-center justify-center p-3 sm:p-4 rounded-3xl overflow-hidden">
          <div className="max-w-md w-full bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5 text-center">
            <p className="font-bold text-gray-700">Loading login...</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const hasTriggeredGoogleRef = useRef(false);
  const hasShownCallbackErrorRef = useRef(false);

  const buildOAuthRedirectTo = useCallback(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    return buildAuthCallbackUrl({
      currentOrigin: window.location.origin,
      next: searchParams.get('next'),
    });
  }, [searchParams]);

  const handleGoogleLogin = useCallback(async () => {
    setFormError(null);
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: buildOAuthRedirectTo(),
        },
      });

      if (error) {
        setFormError(error.message || 'Unable to continue with Google right now.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }, [buildOAuthRedirectTo]);

  useEffect(() => {
    const hasCallbackError = searchParams.get('error') === 'auth_callback_failed';
    if (!hasCallbackError || hasShownCallbackErrorRef.current) {
      return;
    }

    hasShownCallbackErrorRef.current = true;
    setFormError('Authentication callback failed. Please try again.');
  }, [searchParams]);

  useEffect(() => {
    const useGoogle = searchParams.get('provider') === 'google';
    if (!useGoogle || hasTriggeredGoogleRef.current) {
      return;
    }

    hasTriggeredGoogleRef.current = true;
    void handleGoogleLogin();
  }, [handleGoogleLogin, searchParams]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, []);

  // Auto-redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      }
    };
    void checkSession();
  }, [router]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setFormError(error.message || 'Unable to log in right now.');
        return;
      }

      // Store reminder preference
      if (typeof window !== 'undefined') {
        localStorage.setItem('rememberMe', rememberMe ? 'true' : 'false');
      }

      router.push('/');
      router.refresh();
    } catch {
      setFormError('Unable to log in right now.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-9.25rem)] bg-[#f3f4f6] flex items-center justify-center p-3 sm:p-4 rounded-3xl overflow-hidden">
      <div className="max-w-md w-full bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5">
        <div className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2 text-black">Welcome Back</h1>
          <p className="text-gray-600 font-medium">Log in to PennyWise to manage your expenses.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
              className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <label className="font-bold text-black" htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="••••••••" 
              required
              className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium"
            />
            <div className="flex items-center justify-between mt-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 border-2 border-black rounded cursor-pointer accent-blue-600"
                />
                <span className="font-bold text-black group-hover:text-blue-600 transition-colors">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-lg rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>

          <button
            type="button"
            onClick={() => {
              void handleGoogleLogin();
            }}
            disabled={isLoading || isGoogleLoading}
            className="w-full py-3 px-4 bg-white text-black font-black text-lg rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center justify-center gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border-2 border-black bg-yellow-300 text-sm font-black leading-none">G</span>
              {isGoogleLoading ? 'Redirecting...' : 'Continue with Google'}
            </span>
          </button>

          {formError ? (
            <p className="text-sm font-bold text-red-600">{formError}</p>
          ) : null}
        </form>

        <div className="mt-6 text-center border-t-2 border-gray-100 pt-4">
          <p className="text-gray-600 font-bold">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-4">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
