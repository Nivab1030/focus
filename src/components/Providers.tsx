'use client';

import React from 'react';
import { AuthProvider } from '@/lib/AuthContext';
import { HabitProvider } from '@/lib/HabitContext';
import Navigation from './Navigation';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <HabitProvider>
        <Navigation />
        {children}
      </HabitProvider>
    </AuthProvider>
  );
} 