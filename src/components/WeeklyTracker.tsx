'use client';

import { format, startOfWeek, addDays, isToday, isPast } from 'date-fns';
import { useHabits } from '@/lib/HabitContext';

export default function WeeklyTracker() {
  const { categories } = useHabits();
  const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 0 });
  
  // Generate array of dates for the current week
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));

  // Calculate total habits and completed habits for each day
  const getDayStats = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    let totalHabits = 0;
    let completedHabits = 0;

    categories.forEach(category => {
      category.habits.forEach(habit => {
        totalHabits++;
        const completion = habit.completions.find(c => c.date === dateStr);
        if (completion?.completed) {
          completedHabits++;
        }
      });
    });

    return { totalHabits, completedHabits };
  };

  return (
    <div className="flex items-center space-x-1">
      {weekDates.map((date, index) => {
        const { totalHabits, completedHabits } = getDayStats(date);
        const isCurrentDay = isToday(date);
        const isPastDay = isPast(date) && !isCurrentDay;
        const progress = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

        // Determine color based on progress
        const getColor = () => {
          if (isCurrentDay) return 'rgba(59, 130, 246, 0.6)';
          if (!isPastDay) return 'rgba(255, 255, 255, 0.1)';
          
          if (progress === 100) return 'rgba(52, 211, 153, 0.6)';
          if (progress > 0) return 'rgba(251, 191, 36, 0.6)';
          return 'rgba(239, 68, 68, 0.6)';
        };

        return (
          <div
            key={index}
            className="flex flex-col items-center"
          >
            <span className="text-[10px] text-white/70">
              {format(date, 'E')}
            </span>
            
            <div className="relative flex flex-col items-center">
              <div
                className={`w-5 h-5 rounded-sm flex items-center justify-center text-[10px] 
                  ${isCurrentDay ? 'border border-white/50' : 'border border-white/10'}`}
                style={{
                  background: getColor()
                }}
              >
                <span className="z-10 font-medium">
                  {format(date, 'd')}
                </span>
              </div>
              
              {/* Progress indicator - simplified */}
              {totalHabits > 0 && (
                <div className="w-full h-[2px] mt-[2px] rounded-full overflow-hidden bg-white/10">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${progress}%`,
                      background: progress === 100 
                        ? 'rgba(52, 211, 153, 0.8)'
                        : progress > 50
                          ? 'rgba(251, 191, 36, 0.8)'
                          : 'rgba(239, 68, 68, 0.8)'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
} 