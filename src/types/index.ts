export type HabitCategory = {
  id: string;
  name: string;
  color: string;
  habits: Habit[];
};

export type Habit = {
  id: string;
  title: string;
  categoryId: string;
  frequency: {
    type: 'daily' | 'custom';
    specificDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  };
  completions: HabitCompletion[];
};

export type HabitCompletion = {
  date: string; // ISO string format
  completed: boolean;
};

export type CategoryCompletionData = {
  id: string;
  color: string;
  scheduled: number;
  completed: number;
};

export type CalendarData = {
  date: string;
  count: number;
  percentage: number;
  categoryData: CategoryCompletionData[];
}; 