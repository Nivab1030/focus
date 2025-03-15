'use client';

import React, { useMemo, useState, useRef } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { subYears, format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarData, CategoryCompletionData } from '@/types';
import { useHabits } from '@/lib/HabitContext';
import { generateCalendarData } from '@/lib/utils';

import 'react-calendar-heatmap/dist/styles.css';

export default function HeatMap() {
  const { categories } = useHabits();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<CalendarData | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Flatten all habits from all categories
  const allHabits = useMemo(() => {
    return categories.flatMap(category => category.habits);
  }, [categories]);
  
  // Generate calendar data for the heatmap
  const calendarData = useMemo(() => {
    return generateCalendarData(allHabits, categories, selectedCategory);
  }, [allHabits, categories, selectedCategory]);
  
  // Get date range for the heatmap
  const today = new Date();
  const startDate = subYears(today, 1);
  
  // Function to determine the color based on completion percentage
  const getColorClass = (value: any) => {
    if (!value || !value.categoryData || value.categoryData.length === 0) {
      return 'color-empty';
    }
    
    // If we're filtering by category, use that category's color
    if (selectedCategory) {
      const categoryData = value.categoryData.find((d: CategoryCompletionData) => d.id === selectedCategory);
      
      if (!categoryData) return 'color-empty';
      
      const percentage = Math.floor(categoryData.completed / categoryData.scheduled * 100);
      
      if (percentage === 0) return `color-${selectedCategory}-0`;
      if (percentage < 25) return `color-${selectedCategory}-25`;
      if (percentage < 50) return `color-${selectedCategory}-50`;
      if (percentage < 75) return `color-${selectedCategory}-75`;
      return `color-${selectedCategory}-100`;
    }
    
    // For all categories view
    const totalScheduled = value.categoryData.reduce((sum: number, data: CategoryCompletionData) => sum + data.scheduled, 0);
    const totalCompleted = value.categoryData.reduce((sum: number, data: CategoryCompletionData) => sum + data.completed, 0);
    const percentage = totalScheduled > 0 ? Math.floor(totalCompleted / totalScheduled * 100) : 0;
    
    if (percentage === 0) return 'color-multi-0';
    if (percentage < 25) return 'color-multi-25';
    if (percentage < 50) return 'color-multi-50';
    if (percentage < 75) return 'color-multi-75';
    return 'color-multi-100';
  };
  
  // Handle cell hover
  const handleCellHover = (event: React.MouseEvent, value: any) => {
    setHoveredCell(value as CalendarData | null);
    
    if (tooltipRef.current && value) {
      const rect = event.currentTarget.getBoundingClientRect();
      tooltipRef.current.style.left = `${rect.left + rect.width / 2}px`;
      tooltipRef.current.style.top = `${rect.top - 10}px`;
    }
  };

  // Generate CSS for category colors
  const categoryColorStyles = categories.map(category => `
    .react-calendar-heatmap .color-${category.id}-0 {
      fill: ${category.color}10;
    }
    .react-calendar-heatmap .color-${category.id}-25 {
      fill: ${category.color}30;
    }
    .react-calendar-heatmap .color-${category.id}-50 {
      fill: ${category.color}50;
    }
    .react-calendar-heatmap .color-${category.id}-75 {
      fill: ${category.color}70;
    }
    .react-calendar-heatmap .color-${category.id}-100 {
      fill: ${category.color}90;
    }
  `).join('\n');
  
  return (
    <>
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">Habit History</h2>
          
          <div className="flex space-x-1 text-xs">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={`px-3 py-1.5 rounded-md ${!selectedCategory ? 'border border-white/30 backdrop-blur-sm bg-white/10' : ''}`}
            >
              <span className="relative z-10">All</span>
            </button>
            
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1.5 rounded-md relative ${selectedCategory === category.id ? 'border border-white/30 backdrop-blur-sm bg-white/10' : ''}`}
              >
                <span className="relative z-10" style={{ color: category.color }}>
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto pb-2 relative">
          <div className="min-w-[650px]">
            {/* @ts-ignore - Ignoring type issues with the CalendarHeatmap component */}
            <CalendarHeatmap
              startDate={startDate}
              endDate={today}
              values={calendarData}
              classForValue={getColorClass}
              showWeekdayLabels
              horizontal={true}
              gutterSize={2}
              onClick={(value) => {
                // Handle click if needed
              }}
            />
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .react-calendar-heatmap .color-empty {
          fill: rgba(255, 255, 255, 0.05);
        }
        
        /* Multi-category colors */
        .react-calendar-heatmap .color-multi-0 {
          fill: rgba(255, 255, 255, 0.1);
        }
        .react-calendar-heatmap .color-multi-25 {
          fill: rgba(255, 255, 255, 0.2);
        }
        .react-calendar-heatmap .color-multi-50 {
          fill: rgba(255, 255, 255, 0.3);
        }
        .react-calendar-heatmap .color-multi-75 {
          fill: rgba(255, 255, 255, 0.4);
        }
        .react-calendar-heatmap .color-multi-100 {
          fill: rgba(255, 255, 255, 0.5);
        }
        
        /* Category-specific colors */
        ${categoryColorStyles}
      `}</style>
    </>
  );
} 