"use client"
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Code, Menu, X, Zap, Calendar, User, Shuffle } from 'lucide-react'

import { UserButton } from '@clerk/nextjs'
import CustomDarkModeToggle from './CustomDarkModeToggle'
import AnimatedDarkModeToggle from './AnimatedDarkModeToggle'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const navigationItems = [
    { href: "/leetcode/random", label: "Random", icon: Shuffle },
    { href: "/leetcode/daily", label: "Daily", icon: Calendar },
    { href: "/leetcode/profile", label: "Profile", icon: User },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white/80   dark:bg-gray-900 shadow-sm backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
       
          <div className="flex items-center flex-shrink-0">
            <Link 
              href="/" 
              className="flex items-center space-x-3 group transition-all duration-200 hover:scale-105"
            >
              {/* Optimized image with Next.js Image component */}
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <Image 
                  src="/logo.webp"
                  alt="LeetCode Prep Logo"
                  width={40}
                  height={40}
                  priority
                  className="rounded-full object-cover"
                  sizes="40px"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  <span className="hidden sm:inline">LeetCode Prep</span>
                  <span className="sm:hidden">LC Prep</span>
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  Interview Ready
                </span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100/70 dark:hover:bg-gray-800/70  relative group"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 rounded-full" />
                </Link>
              )
            })}
            
            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
            
            {/* User Controls */}
            <div className="flex items-center space-x-3">
              <div className="p-1">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 ring-2 ring-gray-200 dark:ring-gray-700 hover:ring-blue-500 transition-all duration-200"
                    }
                  }}
                />
              </div>
            <AnimatedDarkModeToggle/>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="md:hidden flex items-center space-x-3">
             <AnimatedDarkModeToggle/>
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle main menu"
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6 rotate-90 transition-transform duration-200" />
              ) : (
                <Menu className="block h-6 w-6 transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen 
            ? 'max-h-96 opacity-100' 
            : 'max-h-0 opacity-0'
        }`}>
          <div className="px-2 pt-4 pb-6 space-y-2 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-b-2xl mx-4 mt-2">
            
            {/* User Section */}
            <div className="flex items-center space-x-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 ring-2 ring-gray-200 dark:ring-gray-600"
                  }
                }}
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Your Account
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Manage your progress
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 group border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm"
                  >
                    <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors duration-200">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}