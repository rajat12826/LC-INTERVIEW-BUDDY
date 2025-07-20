import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// import { Toaster } from 'react-hot-toast'
import Navbar from './_components/layout/Navbar'
import { Toaster } from "sonner";
// import { ClerkProvider } from "@clerk/nextjs";
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
    <html lang="en" data-theme="dark">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/logo.ico" type="image/x-icon" />
      
      </head>
      <body className={inter.className}>
      <ThemeProvider attribute="class">
        <div className="min-h-screen bg-gray-50 font-product">

        
          
          <ClerkProvider>
          {/* <Navbar /> */}
          <Toaster />
          {/* <Header/> */}
            {children}

          </ClerkProvider>
        
        </div>
        </ThemeProvider>
      </body>
    </html>
  )
}