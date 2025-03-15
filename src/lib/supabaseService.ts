import { supabase } from './supabase';
import { HabitCategory, Habit, HabitCompletion } from '@/types';

// Database types that match our Supabase schema
type DbHabitCategory = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at?: string;
};

type DbHabit = {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  frequency_type: 'daily' | 'custom';
  frequency_days?: number[];
  created_at?: string;
};

type DbHabitCompletion = {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  completed: boolean;
  created_at?: string;
};

// Fetch all habit categories for a user
export async function fetchHabitCategories(userId: string): Promise<HabitCategory[]> {
  try {
    // Fetch categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('habit_categories')
      .select('*')
      .eq('user_id', userId);

    if (categoriesError) throw categoriesError;

    // Fetch habits
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId);

    if (habitsError) throw habitsError;

    // Fetch completions
    const { data: completionsData, error: completionsError } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId);

    if (completionsError) throw completionsError;

    // Map database data to our app types
    const categories: HabitCategory[] = categoriesData.map((category: DbHabitCategory) => {
      const categoryHabits = habitsData
        .filter((habit: DbHabit) => habit.category_id === category.id)
        .map((habit: DbHabit) => {
          const habitCompletions = completionsData
            .filter((completion: DbHabitCompletion) => completion.habit_id === habit.id)
            .map((completion: DbHabitCompletion) => ({
              date: completion.date,
              completed: completion.completed
            }));

          return {
            id: habit.id,
            title: habit.title,
            categoryId: habit.category_id,
            frequency: {
              type: habit.frequency_type,
              specificDays: habit.frequency_days
            },
            completions: habitCompletions
          };
        });

      return {
        id: category.id,
        name: category.name,
        color: category.color,
        habits: categoryHabits
      };
    });

    return categories;
  } catch (error) {
    console.error('Error fetching habit data:', error);
    throw error;
  }
}

// Add a new habit category
export async function addHabitCategory(
  userId: string,
  category: Omit<HabitCategory, 'id' | 'habits'>
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('habit_categories')
      .insert({
        user_id: userId,
        name: category.name,
        color: category.color
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error adding habit category:', error);
    throw error;
  }
}

// Add a new habit
export async function addHabit(
  userId: string,
  habit: Omit<Habit, 'id' | 'completions'>
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        category_id: habit.categoryId,
        title: habit.title,
        frequency_type: habit.frequency.type,
        frequency_days: habit.frequency.specificDays
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error adding habit:', error);
    throw error;
  }
}

// Toggle a habit completion
export async function toggleHabitCompletion(
  userId: string,
  habitId: string,
  date: string,
  completed: boolean
): Promise<void> {
  try {
    // Check if completion already exists
    const { data: existingData, error: existingError } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', habitId)
      .eq('date', date)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existingData) {
      // Update existing completion
      const { error } = await supabase
        .from('habit_completions')
        .update({ completed })
        .eq('id', existingData.id);

      if (error) throw error;
    } else {
      // Insert new completion
      const { error } = await supabase
        .from('habit_completions')
        .insert({
          user_id: userId,
          habit_id: habitId,
          date,
          completed
        });

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error toggling habit completion:', error);
    throw error;
  }
}

// Delete a habit
export async function deleteHabit(habitId: string): Promise<void> {
  try {
    // Delete completions first (foreign key constraint)
    const { error: completionsError } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId);

    if (completionsError) throw completionsError;

    // Delete the habit
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting habit:', error);
    throw error;
  }
}

// Update a habit
export async function updateHabit(
  habitId: string,
  updates: Partial<Omit<Habit, 'id' | 'categoryId' | 'completions'>>
): Promise<void> {
  try {
    const updateData: any = {};
    
    if (updates.title) {
      updateData.title = updates.title;
    }
    
    if (updates.frequency) {
      if (updates.frequency.type) {
        updateData.frequency_type = updates.frequency.type;
      }
      if (updates.frequency.specificDays) {
        updateData.frequency_days = updates.frequency.specificDays;
      }
    }

    const { error } = await supabase
      .from('habits')
      .update(updateData)
      .eq('id', habitId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating habit:', error);
    throw error;
  }
}

// Export data for analysis
export async function exportHabitData(userId: string, startDate?: string, endDate?: string) {
  try {
    let query = supabase
      .from('habit_completions')
      .select(`
        id,
        date,
        completed,
        habits(id, title, category_id),
        habit_categories(id, name, color)
      `)
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error exporting habit data:', error);
    throw error;
  }
}

// Get quarterly summary
export async function getQuarterlySummary(userId: string, year: number, quarter: number) {
  // Calculate quarter date range
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  try {
    // Get all completions for the quarter
    const { data, error } = await supabase
      .from('habit_completions')
      .select(`
        id,
        date,
        completed,
        habits(id, title, category_id),
        habit_categories(id, name, color)
      `)
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .lte('date', endDateStr);

    if (error) throw error;
    
    // Process data for summary
    // This is a simple example - you can make this more sophisticated
    const summary = {
      period: `Q${quarter} ${year}`,
      totalHabits: new Set(data.map((item: any) => item.habits?.id)).size,
      totalCompletions: data.filter((item: any) => item.completed).length,
      completionRate: 0,
      categoryBreakdown: {} as Record<string, { total: number, completed: number, rate: number }>
    };
    
    // Calculate completion rate
    if (data.length > 0) {
      summary.completionRate = (summary.totalCompletions / data.length) * 100;
    }
    
    // Calculate category breakdown
    data.forEach((item: any) => {
      const categoryId = item.habit_categories?.id;
      const categoryName = item.habit_categories?.name;
      
      if (categoryId && categoryName) {
        if (!summary.categoryBreakdown[categoryName]) {
          summary.categoryBreakdown[categoryName] = { total: 0, completed: 0, rate: 0 };
        }
        
        summary.categoryBreakdown[categoryName].total++;
        if (item.completed) {
          summary.categoryBreakdown[categoryName].completed++;
        }
      }
    });
    
    // Calculate rates for each category
    Object.keys(summary.categoryBreakdown).forEach(category => {
      const { total, completed } = summary.categoryBreakdown[category];
      summary.categoryBreakdown[category].rate = (completed / total) * 100;
    });
    
    return summary;
  } catch (error) {
    console.error('Error getting quarterly summary:', error);
    throw error;
  }
} 