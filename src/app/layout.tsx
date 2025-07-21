import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from "sonner"; // Import Toaster from sonner
import { ThemeProvider } from 'next-themes';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LeetCode Interview Prep',
  description: 'Ace Your Tech Interviews',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/logo.ico" type="image/x-icon" />
      </head>
      <body className={inter.className}>
        {/* ThemeProvider should wrap the entire content where theme is applied */}
        <ThemeProvider attribute="class">
          <div className="min-h-screen bg-gray-50 font-product">
            <ClerkProvider>
              {children}
        
              <Toaster position="bottom-right" richColors />
            </ClerkProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
