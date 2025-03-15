'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HabitCategory, Habit, HabitCompletion } from '@/types';
import { generateId, formatDateToYYYYMMDD } from './utils';
import { startOfWeek, isSameWeek } from 'date-fns';
import { useAuth } from './AuthContext';
import * as supabaseService from './supabaseService';

// Sample initial data for new users
const initialCategories: HabitCategory[] = [
  {
    id: 'health',
    name: 'Health',
    color: '#4ade80', // Green
    habits: []
  },
  {
    id: 'productivity',
    name: 'Productivity',
    color: '#60a5fa', // Blue
    habits: []
  },
  {
    id: 'personal',
    name: 'Personal',
    color: '#f472b6', // Pink
    habits: []
  }
];

// Define the context type
type HabitContextType = {
  categories: HabitCategory[];
  loading: boolean;
  addHabit: (categoryId: string, habit: Omit<Habit, 'id' | 'categoryId' | 'completions'>) => void;
  toggleHabitCompletion: (habitId: string, date: Date) => void;
  deleteHabit: (habitId: string) => void;
  updateHabit: (habitId: string, updates: Partial<Omit<Habit, 'id' | 'categoryId' | 'completions'>>) => void;
  clearWeeklyCompletions: () => void;
  exportData: (startDate?: string, endDate?: string) => Promise<any>;
  getQuarterlySummary: (year: number, quarter: number) => Promise<any>;
};

// Create the context
const HabitContext = createContext<HabitContextType | undefined>(undefined);

// Create a provider component
export function HabitProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<HabitCategory[]>(initialCategories);
  const [loading, setLoading] = useState(true);
  const [lastWeekChecked, setLastWeekChecked] = useState<string | null>(null);

  // Load data from Supabase when user is authenticated
  useEffect(() => {
    async function loadData() {
      if (user) {
        setLoading(true);
        try {
          const data = await supabaseService.fetchHabitCategories(user.id);
          if (data && data.length > 0) {
            setCategories(data);
          } else {
            // For new users, initialize with default categories
            for (const category of initialCategories) {
              await supabaseService.addHabitCategory(user.id, {
                name: category.name,
                color: category.color
              });
            }
            // Reload data after initialization
            const freshData = await supabaseService.fetchHabitCategories(user.id);
            setCategories(freshData);
          }
        } catch (error) {
          console.error('Error loading habit data:', error);
          // Fallback to localStorage if Supabase fails
          const saved = localStorage.getItem('habitCategories');
          if (saved) {
            setCategories(JSON.parse(saved));
          }
        } finally {
          setLoading(false);
        }
      } else {
        // Not logged in, try to load from localStorage
        const saved = localStorage.getItem('habitCategories');
        if (saved) {
          setCategories(JSON.parse(saved));
        }
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  // Save to localStorage as a backup
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('habitCategories', JSON.stringify(categories));
    }
  }, [categories, loading]);

  // Check for a new week and clear completions if needed
  useEffect(() => {
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 });
    const currentWeekKey = formatDateToYYYYMMDD(currentWeekStart);

    // Get the last week checked from localStorage
    const savedLastWeekChecked = localStorage.getItem('lastWeekChecked');
    setLastWeekChecked(savedLastWeekChecked);

    // If it's a new week, clear completions
    if (savedLastWeekChecked !== currentWeekKey) {
      clearWeeklyCompletions();
      localStorage.setItem('lastWeekChecked', currentWeekKey);
      setLastWeekChecked(currentWeekKey);
    }
  }, []);

  // Add a new habit to a category
  const addHabit = async (categoryId: string, habitData: Omit<Habit, 'id' | 'categoryId' | 'completions'>) => {
    let newHabitId = generateId();

    // If user is logged in, save to Supabase
    if (user) {
      try {
        newHabitId = await supabaseService.addHabit(user.id, {
          ...habitData,
          categoryId
        });
      } catch (error) {
        console.error('Error adding habit to Supabase:', error);
        // Continue with local state even if Supabase fails
      }
    }

    const newHabit: Habit = {
      id: newHabitId,
      categoryId,
      completions: [],
      ...habitData
    };

    setCategories(prevCategories => 
      prevCategories.map(category => 
        category.id === categoryId
          ? { ...category, habits: [...category.habits, newHabit] }
          : category
      )
    );
  };

  // Toggle a habit completion for a specific date
  const toggleHabitCompletion = async (habitId: string, date: Date) => {
    const dateStr = formatDateToYYYYMMDD(date);

    // Find the habit to determine its current completion status
    let currentlyCompleted = false;
    let habitFound = false;

    for (const category of categories) {
      const habit = category.habits.find(h => h.id === habitId);
      if (habit) {
        const existingCompletion = habit.completions.find(c => c.date === dateStr);
        if (existingCompletion) {
          currentlyCompleted = existingCompletion.completed;
        }
        habitFound = true;
        break;
      }
    }

    if (!habitFound) return;

    // Toggle the completion status
    const newCompletionStatus = !currentlyCompleted;

    // If user is logged in, save to Supabase
    if (user) {
      try {
        await supabaseService.toggleHabitCompletion(
          user.id,
          habitId,
          dateStr,
          newCompletionStatus
        );
      } catch (error) {
        console.error('Error toggling habit completion in Supabase:', error);
        // Continue with local state even if Supabase fails
      }
    }

    setCategories(prevCategories => 
      prevCategories.map(category => ({
        ...category,
        habits: category.habits.map(habit => {
          if (habit.id !== habitId) return habit;

          // Check if there's already a completion for this date
          const existingCompletionIndex = habit.completions.findIndex(
            c => c.date === dateStr
          );

          let newCompletions: HabitCompletion[];

          if (existingCompletionIndex >= 0) {
            // Toggle the existing completion
            newCompletions = [...habit.completions];
            newCompletions[existingCompletionIndex] = {
              ...newCompletions[existingCompletionIndex],
              completed: newCompletionStatus
            };
          } else {
            // Add a new completion
            newCompletions = [
              ...habit.completions,
              { date: dateStr, completed: newCompletionStatus }
            ];
          }

          return { ...habit, completions: newCompletions };
        })
      }))
    );
  };

  // Delete a habit
  const deleteHabit = async (habitId: string) => {
    // If user is logged in, delete from Supabase
    if (user) {
      try {
        await supabaseService.deleteHabit(habitId);
      } catch (error) {
        console.error('Error deleting habit from Supabase:', error);
        // Continue with local state even if Supabase fails
      }
    }

    setCategories(prevCategories => 
      prevCategories.map(category => ({
        ...category,
        habits: category.habits.filter(habit => habit.id !== habitId)
      }))
    );
  };

  // Update a habit
  const updateHabit = async (habitId: string, updates: Partial<Omit<Habit, 'id' | 'categoryId' | 'completions'>>) => {
    // If user is logged in, update in Supabase
    if (user) {
      try {
        await supabaseService.updateHabit(habitId, updates);
      } catch (error) {
        console.error('Error updating habit in Supabase:', error);
        // Continue with local state even if Supabase fails
      }
    }

    setCategories(prevCategories => 
      prevCategories.map(category => ({
        ...category,
        habits: category.habits.map(habit => 
          habit.id === habitId ? { ...habit, ...updates } : habit
        )
      }))
    );
  };

  // Clear weekly completions
  const clearWeeklyCompletions = () => {
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 });

    setCategories(prevCategories => 
      prevCategories.map(category => ({
        ...category,
        habits: category.habits.map(habit => {
          // Filter out completions from the current week
          const filteredCompletions = habit.completions.filter(completion => {
            const completionDate = new Date(completion.date);
            return !isSameWeek(completionDate, today, { weekStartsOn: 0 });
          });

          return { ...habit, completions: filteredCompletions };
        })
      }))
    );
  };

  // Export data for analysis
  const exportData = async (startDate?: string, endDate?: string) => {
    if (!user) {
      throw new Error('User must be logged in to export data');
    }

    try {
      return await supabaseService.exportHabitData(user.id, startDate, endDate);
    } catch (error) {
      console.error('Error exporting habit data:', error);
      throw error;
    }
  };

  // Get quarterly summary
  const getQuarterlySummary = async (year: number, quarter: number) => {
    if (!user) {
      throw new Error('User must be logged in to get quarterly summary');
    }

    try {
      return await supabaseService.getQuarterlySummary(user.id, year, quarter);
    } catch (error) {
      console.error('Error getting quarterly summary:', error);
      throw error;
    }
  };

  return (
    <HabitContext.Provider value={{ 
      categories, 
      loading,
      addHabit, 
      toggleHabitCompletion, 
      deleteHabit,
      updateHabit,
      clearWeeklyCompletions,
      exportData,
      getQuarterlySummary
    }}>
      {children}
    </HabitContext.Provider>
  );
}

// Custom hook to use the habit context
export function useHabits() {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
} 