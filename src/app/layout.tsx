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
  title: 'LeetCode Interview Prep | Ace Coding Interviews',
  description:
    'Your ultimate LeetCode interview buddy. Practice top coding interview questions, master DSA, and ace technical interviews.',
  keywords: [
    'leetcode',
    'coding interview',
    'technical interview',
    'faang interview',
    'data structures',
    'algorithms'
  ],

  alternates: {
    canonical: 'https://lc-interview-buddy.vercel.app/',
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: 'LeetCode Interview Prep | Ace Coding Interviews',
    description:
      'Your ultimate LeetCode interview buddy. Practice top coding interview questions and master DSA.',
    url: 'https://lc-interview-buddy.vercel.app/',
    siteName: 'LeetCode Interview Buddy',
    images: [
      {
        url: 'https://lc-interview-buddy.vercel.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'LeetCode Interview Preparation',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'LeetCode Interview Prep | Ace Coding Interviews',
    description:
      'Practice top coding interview questions and master DSA.',
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