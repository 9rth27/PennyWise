'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100dvh-10rem)] bg-[#f3f4f6] flex items-center justify-center p-4 sm:p-6 rounded-3xl">
          <div className="max-w-md w-full bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8 text-center">
            <p className="font-bold text-gray-700">Loading verification...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}

function VerifyEmailPageContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [isResending, setIsResending] = useState(false);

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  const handleResendVerification = async () => {
    if (!supabase) {
      toast.error('Authentication is not configured yet.');
      return;
    }

    if (!email.trim()) {
      toast.error('Please enter your account email.');
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message || 'Unable to resend verification email right now.');
        return;
      }

      toast.success('Verification email sent. Please check your inbox.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-10rem)] bg-[#f3f4f6] flex items-center justify-center p-4 sm:p-6 rounded-3xl">
      <div className="max-w-md w-full bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2 text-black">Verify Your Email</h1>
          <p className="text-gray-600 font-medium">Check your inbox and click the verification link to activate your account.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="font-bold text-black" htmlFor="email">Account Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all font-medium"
            />
          </div>

          <button
            type="button"
            onClick={handleResendVerification}
            disabled={isResending}
            className="w-full py-3 px-4 bg-yellow-400 text-black font-black text-lg rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            {isResending ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>

        <div className="mt-8 text-center border-t-2 border-gray-100 pt-6 space-y-2">
          <p className="text-gray-600 font-bold">
            Already verified?{' '}
            <Link href="/login" className="text-yellow-600 hover:text-yellow-800 underline decoration-2 underline-offset-4">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
