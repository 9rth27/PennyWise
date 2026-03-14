import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Navbar } from '@/components/navbar'
import './globals.css'

const geist = Geist({ subsets: ["latin"], display: 'swap', preload: true });
const geistMono = Geist_Mono({ subsets: ["latin"], display: 'swap', preload: true });

export const metadata: Metadata = {
  title: 'PennyWise - Personal Finance Tracker',
  description: 'Track your expenses with style using the neobrutalist PennyWise money tracker',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  metadataBase: new URL('https://penny-wise.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://penny-wise.vercel.app',
    siteName: 'PennyWise',
  },
  formatDetection: {
    telephone: false,
    email: false,
  },
}

import { Toaster } from 'sonner'

function resolveOrigin(url?: string) {
  if (!url) return '';
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
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
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${connectSrc.join(' ')}`,
    `frame-src ${frameSrc.join(' ')}`,
    "frame-ancestors 'none'",
  ].join('; ');
}

const contentSecurityPolicy = buildContentSecurityPolicy();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#ffffff" />
        {/* Security: Content Security Policy */}
        <meta 
          httpEquiv="Content-Security-Policy" 
          content={contentSecurityPolicy}
        />
      </head>
      <body className={`${geist.className} font-sans antialiased bg-white`}>
        <Toaster position="bottom-right" richColors />
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  )
}
