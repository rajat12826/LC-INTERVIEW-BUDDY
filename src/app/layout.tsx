// layout.tsx
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from "sonner";
import { ThemeProvider } from 'next-themes';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from '@/providers/QueryProvider';
import { NavigationProvider } from '@/providers/NavigationProvider';
import { GlobalInteractions } from '@/components/GlobalInteractions';

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const viewport: Viewport = {
  themeColor: '#0F172A',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://lc-interview-buddy.vercel.app'),
  title: {
    default: 'LeetCode Interview Buddy (LC Buddy) – AI Coding Interview Prep & Tutor',
    template: '%s | LeetCode Interview Buddy',
  },
  description:
    'LeetCode Interview Buddy (LC Buddy) is an AI-powered coding interview companion. Master DSA problems, receive instant Socratic hints, write code in Monaco Editor, and ace technical interviews.',
  keywords: [
    'lc interview buddy',
    'leetcode interview buddy',
    'lc buddy',
    'leetcode ai buddy',
    'leetcode interview prep',
    'coding interview prep',
    'ai coding tutor',
    'dsa practice',
    'technical interview preparation',
    'faang interview prep'
  ],

  alternates: {
    canonical: 'https://lc-interview-buddy.vercel.app',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  openGraph: {
    title: 'LeetCode Interview Buddy (LC Buddy) – AI Coding Interview Prep & Tutor',
    description:
      'LeetCode Interview Buddy (LC Buddy) is an AI-powered coding interview companion. Master DSA problems, receive instant Socratic hints, and ace technical interviews.',
    url: 'https://lc-interview-buddy.vercel.app',
    siteName: 'LeetCode Interview Buddy',
    images: [
      {
        url: 'https://lc-interview-buddy.vercel.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'LeetCode Interview Buddy - AI Coding Companion',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'LeetCode Interview Buddy (LC Buddy) – AI Coding Interview Prep',
    description:
      'Master DSA problems and ace technical interviews with your AI coding buddy.',
    images: ['https://lc-interview-buddy.vercel.app/twitter-image.jpg'],
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Website",
              name: "LeetCode Interview Prep",
              url: "https://lc-interview-buddy.vercel.app/"
            })
          }}
        />

        <link rel="icon" href="/logo.ico" type="image/x-icon" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class">
          <div className="min-h-screen bg-background font-product">
            <ClerkProvider>
              <QueryProvider>
                <NavigationProvider>
                  <GlobalInteractions>
                    {children}
                    <Toaster position="bottom-right" richColors />
                  </GlobalInteractions>
                </NavigationProvider>
              </QueryProvider>
            </ClerkProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}