'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/outline';
import { HabitCategory as HabitCategoryType } from '@/types';
import HabitItem from './HabitItem';
import HabitForm from './HabitForm';
import { useHabits } from '@/lib/HabitContext';

type HabitCategoryProps = {
  category: HabitCategoryType;
};

export default function HabitCategory({ category }: HabitCategoryProps) {
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { addHabit } = useHabits();

  const handleAddHabit = (habitData: any) => {
    addHabit(category.id, habitData);
    setIsAddingHabit(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="backdrop-blur-md bg-white/10 rounded-xl overflow-hidden relative transition-all duration-200 hover:bg-white/15"
      style={{ borderTop: `3px solid ${category.color}` }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="p-4">
        <h2 className="text-lg font-medium mb-3 flex items-center text-white">
          <span 
            className="inline-block w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: category.color }}
          />
          {category.name}
        </h2>
        
        <div className="space-y-3 habit-container max-h-[250px]">
          {category.habits.length === 0 && !isAddingHabit && (
            <p className="text-sm opacity-70 italic">No habits added yet</p>
          )}
          
          {category.habits.map(habit => (
            <HabitItem key={habit.id} habit={habit} categoryColor={category.color} />
          ))}
          
          {isAddingHabit ? (
            <HabitForm 
              onSubmit={handleAddHabit} 
              onCancel={() => setIsAddingHabit(false)} 
            />
          ) : (
            <motion.button
              onClick={() => setIsAddingHabit(true)}
              className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100 transition-all mt-3 px-2 py-1 rounded-md"
              whileHover={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                scale: 1.02
              }}
              whileTap={{ scale: 0.98 }}
            >
              <PlusIcon className="h-3 w-3" />
              <span>Add Habit</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
} 