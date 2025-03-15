import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isWithinInterval, isSameDay } from 'date-fns';
import { Habit, HabitCompletion, CalendarData, HabitCategory, CategoryCompletionData } from '@/types';

// Generate an array of dates for the current week
export function getCurrentWeekDates(): Date[] {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 0 }); // 0 = Sunday
  const end = endOfWeek(today, { weekStartsOn: 0 });
  
  return eachDayOfInterval({ start, end });
}

// Format a date as YYYY-MM-DD
export function formatDateToYYYYMMDD(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// Check if a habit is scheduled for a specific day
export function isHabitScheduledForDay(habit: Habit, date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  switch (habit.frequency.type) {
    case 'daily':
      return true;
    case 'custom':
      // For custom habits, check if the current day is in the specificDays array
      return habit.frequency.specificDays?.includes(dayOfWeek) || false;
    default:
      return false;
  }
}

// Check if a habit is completed for a specific day
export function isHabitCompletedForDay(habit: Habit, date: Date): boolean {
  const dateStr = formatDateToYYYYMMDD(date);
  return habit.completions.some(completion => 
    completion.date === dateStr && completion.completed
  );
}

// Generate calendar data for the heatmap with category information
export function generateCalendarData(
  habits: Habit[], 
  categories: HabitCategory[],
  selectedCategoryId?: string
): CalendarData[] {
  // Get dates for the last 365 days
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  
  const dateRange = eachDayOfInterval({ start: oneYearAgo, end: today });
  
  // Create a map of category IDs to colors
  const categoryColorMap = new Map<string, string>();
  categories.forEach(category => {
    categoryColorMap.set(category.id, category.color);
  });
  
  // Filter habits by selected category if needed
  const filteredHabits = selectedCategoryId 
    ? habits.filter(habit => habit.categoryId === selectedCategoryId)
    : habits;
  
  return dateRange.map(date => {
    const dateStr = formatDateToYYYYMMDD(date);
    
    // Group habits by category
    const habitsByCategory = new Map<string, Habit[]>();
    
    filteredHabits.forEach(habit => {
      if (!habitsByCategory.has(habit.categoryId)) {
        habitsByCategory.set(habit.categoryId, []);
      }
      habitsByCategory.get(habit.categoryId)?.push(habit);
    });
    
    // Calculate completion data for each category
    const categoryData: CategoryCompletionData[] = [];
    
    habitsByCategory.forEach((categoryHabits, categoryId) => {
      // Count scheduled habits for this day
      const scheduledHabits = categoryHabits.filter(habit => isHabitScheduledForDay(habit, date));
      const scheduledCount = scheduledHabits.length;
      
      // Count completed habits for this day
      const completedHabits = scheduledHabits.filter(habit => isHabitCompletedForDay(habit, date));
      const completedCount = completedHabits.length;
      
      if (scheduledCount > 0) {
        categoryData.push({
          id: categoryId,
          color: categoryColorMap.get(categoryId) || '#cccccc',
          scheduled: scheduledCount,
          completed: completedCount
        });
      }
    });
    
    // Calculate overall completion data
    const totalScheduled = categoryData.reduce((sum, data) => sum + data.scheduled, 0);
    const totalCompleted = categoryData.reduce((sum, data) => sum + data.completed, 0);
    const percentage = totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0;
    
    return {
      date: dateStr,
      count: totalCompleted,
      percentage,
      categoryData
    };
  });
}

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
} 