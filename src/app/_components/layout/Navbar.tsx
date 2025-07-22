"use client"
import { useState } from 'react'
import Link from 'next/link'
import { Code, Menu, X } from 'lucide-react'
import ToggleButton from '../Toggle'
import { UserButton } from '@clerk/nextjs'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <Code className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                <span className="hidden sm:inline">LeetCode Interview Prep</span>
                <span className="sm:hidden">LeetCode Prep</span>
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
             <Link href="/questions/daily">
        Daily Question 
      </Link>
            <UserButton />
            <ToggleButton />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-6">
            <ToggleButton />
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
               
                 
                 <Menu className="block h-6 w-6" aria-hidden="true" />
             
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <UserButton />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Account</span>
                </div>
              
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}