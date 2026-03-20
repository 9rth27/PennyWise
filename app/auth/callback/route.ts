import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
  const type = requestUrl.searchParams.get('type') || ''; // 'email_change', 'signup', etc.

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.exchangeCodeForSession(code);
      
      // Add email confirmation flag to redirect
      const isEmailConfirmation = type === 'signup' || type === 'email_change' || type === '';
      const redirectUrl = new URL(next, requestUrl.origin);
      if (isEmailConfirmation) {
        redirectUrl.searchParams.set('emailConfirmed', 'true');
      }
      return NextResponse.redirect(redirectUrl);
    } catch {
      return NextResponse.redirect(new URL('/login?error=auth_callback_failed', requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
