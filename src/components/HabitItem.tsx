'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Habit } from '@/types';
import { useHabits } from '@/lib/HabitContext';
import { getCurrentWeekDates, isHabitCompletedForDay, isHabitScheduledForDay, formatDateToYYYYMMDD } from '@/lib/utils';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';

type HabitItemProps = {
  habit: Habit;
  categoryColor: string;
};

// Enhanced confetti using canvas-confetti
const triggerConfetti = (color: string) => {
  const colors = [color, '#ffffff'];
  
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: colors,
    shapes: ['circle', 'square'],
    gravity: 1.2,
    scalar: 0.8,
    ticks: 150
  });
  
  // Fire a second burst for more impressive effect
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { y: 0.7 },
      colors: colors,
      startVelocity: 25,
      gravity: 0.8,
      scalar: 0.6,
      ticks: 200
    });
  }, 250);
};

export default function HabitItem({ habit, categoryColor }: HabitItemProps) {
  const { toggleHabitCompletion, deleteHabit } = useHabits();
  const weekDates = getCurrentWeekDates();
  const [showConfetti, setShowConfetti] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Check if all scheduled days for this week are completed
  const isWeeklyHabitCompleted = () => {
    const scheduledDays = weekDates.filter(date => isHabitScheduledForDay(habit, date));
    const completedDays = scheduledDays.filter(date => isHabitCompletedForDay(habit, date));
    return scheduledDays.length > 0 && completedDays.length === scheduledDays.length;
  };
  
  // Handle habit completion
  const handleToggleCompletion = (date: Date) => {
    toggleHabitCompletion(habit.id, date);
    
    // Check if this completion completes the weekly habit
    const isCompleted = !isHabitCompletedForDay(habit, date);
    if (isCompleted) {
      // We need to simulate the state after the toggle
      const updatedHabit = {
        ...habit,
        completions: [
          ...habit.completions,
          { date: formatDateToYYYYMMDD(date), completed: true }
        ]
      };
      
      // Check if this would complete the weekly habit
      const scheduledDays = weekDates.filter(d => isHabitScheduledForDay(updatedHabit, d));
      const completedDays = scheduledDays.filter(d => {
        if (d.getTime() === date.getTime()) return true; // This day is being completed
        return isHabitCompletedForDay(updatedHabit, d);
      });
      
      if (scheduledDays.length > 0 && completedDays.length === scheduledDays.length) {
        setShowConfetti(true);
        triggerConfetti(categoryColor);
        setTimeout(() => setShowConfetti(false), 2000);
      }
    }
  };
  
  // Get text for frequency display
  const getFrequencyText = () => {
    if (habit.frequency.type === 'daily') {
      return 'Every day';
    } else {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return habit.frequency.specificDays?.map((day: number) => days[day]).join(', ');
    }
  };

  return (
    <div className="backdrop-blur-md bg-white/10 rounded-xl p-4 mb-3 relative transition-all duration-200 hover:bg-white/15">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-base font-medium text-white">{habit.title}</h3>
          <p className="text-xs text-white/60 mt-1">{getFrequencyText()}</p>
        </div>
        
        <button
          onClick={() => deleteHabit(habit.id)}
          className="text-white/40 hover:text-white/80 transition-colors duration-200 p-1"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
      
      <div className="mt-4 flex justify-between">
        {weekDates.map((date, index) => {
          const isScheduled = isHabitScheduledForDay(habit, date);
          const isCompleted = isHabitCompletedForDay(habit, date);
          const isHovered = hoveredDay === index;
          
          return (
            <div key={index} className="flex flex-col items-center">
              <span className="text-xs text-white/60 mb-1">
                {format(date, 'EEE')[0]}
              </span>
              
              {isScheduled ? (
                <button
                  onClick={() => handleToggleCompletion(date)}
                  onMouseEnter={() => setHoveredDay(index)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200
                    ${isCompleted 
                      ? `bg-opacity-80 border-opacity-0` 
                      : `bg-white/5 border-opacity-30`}
                    ${isHovered && !isCompleted ? 'bg-white/20' : ''}
                    border border-white/20
                  `}
                  style={{
                    backgroundColor: isCompleted ? `${categoryColor}` : '',
                    borderColor: isHovered ? categoryColor : ''
                  }}
                >
                  {isCompleted && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ) : (
                <div className="w-8 h-8 rounded-md bg-white/5 opacity-30" />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Show confetti when all scheduled habits for the week are completed */}
      {showConfetti && (
        <canvas 
          ref={confettiCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
      )}
    </div>
  );
} 