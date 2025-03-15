'use client';

import React, { useEffect, useState } from 'react';
import { HabitProvider } from '@/lib/HabitContext';
import HabitCategory from '@/components/HabitCategory';
import HeatMap from '@/components/HeatMap';
import WeeklyTracker from '@/components/WeeklyTracker';
import { useHabits } from '@/lib/HabitContext';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

// Component to display the habit categories
function HabitCategories() {
  const { categories } = useHabits();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {categories.map(category => (
        <HabitCategory key={category.id} category={category} />
      ))}
    </div>
  );
}

// Main page component
export default function Home() {
  const [greeting, setGreeting] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('');
  
  useEffect(() => {
    // Set greeting based on time of day
    const updateGreeting = () => {
      const hour = new Date().getHours();
      let newGreeting = '';
      
      if (hour >= 5 && hour < 12) {
        newGreeting = 'Good morning, Niv';
      } else if (hour >= 12 && hour < 18) {
        newGreeting = 'Good afternoon, Niv';
      } else {
        newGreeting = 'Good evening, Niv';
      }
      
      setGreeting(newGreeting);
    };
    
    // Set current date and time
    const updateDateTime = () => {
      const now = new Date();
      const formattedDateTime = format(now, 'EEEE, MMMM d • h:mm a');
      setCurrentDateTime(formattedDateTime);
    };
    
    // Initial update
    updateGreeting();
    updateDateTime();
    
    // Update time every minute
    const intervalId = setInterval(() => {
      updateGreeting();
      updateDateTime();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <HabitProvider>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">{greeting}</h1>
            <WeeklyTracker />
            <p className="text-sm text-white/80">{currentDateTime}</p>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-4 text-white">Your Habits</h2>
              <HabitCategories />
            </section>
            
            <section>
              <HeatMap />
            </section>
          </div>
          
          <footer className="mt-10 text-center text-xs text-white/60">
            <p>Built with Next.js, React, and Tailwind CSS</p>
          </footer>
        </motion.div>
      </div>
    </HabitProvider>
  );
}
