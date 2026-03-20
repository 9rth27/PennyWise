import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Navbar } from '@/components/navbar'
import './globals.css'

const geist = Geist({ subsets: ["latin"], display: 'swap', preload: true });
const geistMono = Geist_Mono({ subsets: ["latin"], display: 'swap', preload: true });

const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const metadataBaseUrl = (() => {
  try {
    return new URL(appBaseUrl);
  } catch {
    return new URL('http://localhost:3000');
  }
})();

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
  metadataBase: metadataBaseUrl,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: metadataBaseUrl.toString(),
    siteName: 'PennyWise',
  },
  formatDetection: {
    telephone: false,
    email: false,
  },
}

import { Toaster } from 'sonner'

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
      </head>
      <body className={`${geist.className} font-sans antialiased bg-white`} suppressHydrationWarning>
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
