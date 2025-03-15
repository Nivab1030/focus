'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="glass fixed top-4 right-4 z-50 p-2 rounded-full flex items-center space-x-1">
      <Link 
        href="/" 
        className={`p-2 rounded-full transition-all duration-200 ${
          pathname === '/' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </Link>
      
      {user ? (
        <Link 
          href="/profile" 
          className={`p-2 rounded-full transition-all duration-200 ${
            pathname === '/profile' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </Link>
      ) : (
        <Link 
          href="/login" 
          className={`p-2 rounded-full transition-all duration-200 ${
            pathname === '/login' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        </Link>
      )}
    </nav>
  );
} 