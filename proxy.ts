import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/', '/expenses', '/analytics', '/settings', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/help', '/auth/callback'];
const AUTH_ROUTES = ['/login', '/signup'];

function resolveOrigin(url?: string) {
  if (!url) return '';
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname === route || (route !== '/' && pathname.startsWith(`${route}/`)));
}

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isStaticRoute(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|map|js|css)$/.test(pathname)
  );
}

function buildContentSecurityPolicy() {
  const supabaseOrigin = resolveOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const connectSrc = [
    "'self'",
    'https://api.groq.com',
    'https://api.resend.com',
  ];

  if (supabaseOrigin) {
    connectSrc.push(supabaseOrigin);
    if (supabaseOrigin.startsWith('https://')) {
      connectSrc.push(supabaseOrigin.replace(/^https:/, 'wss:'));
    }
  }

  if (turnstileEnabled) {
    connectSrc.push('https://challenges.cloudflare.com');
  }

  const scriptSrc = ["'self'", "'unsafe-inline'", "'unsafe-eval'"];
  const frameSrc = ["'self'"];

  if (turnstileEnabled) {
    scriptSrc.push('https://challenges.cloudflare.com');
    frameSrc.push('https://challenges.cloudflare.com');
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    `connect-src ${connectSrc.join(' ')}`,
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `frame-src ${frameSrc.join(' ')}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

function applyResponseHeaders(response: NextResponse) {
  const appOrigin = resolveOrigin(process.env.NEXT_PUBLIC_APP_URL) || 'http://localhost:3000';

  // CORS Headers
  response.headers.set('Access-Control-Allow-Origin', appOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Content-Security-Policy', buildContentSecurityPolicy());
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  );

  // Remove sensitive server headers
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');

  return response;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Skip heavy logic for static assets
  if (isStaticRoute(pathname)) {
    return applyResponseHeaders(response);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // If supabase isn't configured, just pass through
  if (!supabaseUrl || !supabaseAnonKey) {
    return applyResponseHeaders(response);
  }

  // If it's a public route, pass through without auth check
  const publicCheck = isPublicRoute(pathname);
  console.log(`[proxy] pathname=${pathname} isPublic=${publicCheck} PUBLIC_ROUTES=${JSON.stringify(PUBLIC_ROUTES)}`);
  if (publicCheck || pathname.startsWith('/api/')) {
    return applyResponseHeaders(response);
  }

  // Protected route — check auth
  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
      return applyResponseHeaders(NextResponse.redirect(redirectUrl));
    }

    if (user && isAuthRoute(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      redirectUrl.search = '';
      return applyResponseHeaders(NextResponse.redirect(redirectUrl));
    }
  } catch {
    // On any auth error, fail open and let the page handle it
  }

  return applyResponseHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
