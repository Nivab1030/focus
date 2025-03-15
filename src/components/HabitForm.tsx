'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

type FrequencyType = 'daily' | 'custom';

type FormData = {
  title: string;
  frequencyType: FrequencyType;
  specificDays?: number[];
};

type HabitFormProps = {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: FormData;
};

export default function HabitForm({ onSubmit, onCancel, initialData }: HabitFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: initialData || {
      title: '',
      frequencyType: 'daily',
      specificDays: []
    }
  });
  
  const frequencyType = watch('frequencyType');
  const [selectedDays, setSelectedDays] = useState<number[]>(initialData?.specificDays || []);
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };
  
  const processFormData = (data: FormData) => {
    const formattedData = {
      title: data.title,
      frequency: {
        type: data.frequencyType,
      } as any
    };
    
    if (data.frequencyType === 'custom') {
      formattedData.frequency.specificDays = selectedDays;
    }
    
    onSubmit(formattedData);
  };
  
  return (
    <form onSubmit={handleSubmit(processFormData)} className="backdrop-blur-md bg-white/10 rounded-lg p-3 text-sm">
      <div className="mb-3">
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Habit Title
        </label>
        <input
          id="title"
          type="text"
          {...register('title', { required: 'Title is required' })}
          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/50 dark:bg-gray-800/50"
          placeholder="e.g., Morning Meditation"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>
      
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">
          Frequency
        </label>
        <div className="flex flex-col space-y-2">
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="daily"
              {...register('frequencyType')}
              className="form-radio text-blue-600"
            />
            <span className="ml-2 text-sm">Daily</span>
          </label>
          
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="custom"
              {...register('frequencyType')}
              className="form-radio text-blue-600"
            />
            <span className="ml-2 text-sm">Specific days</span>
          </label>
          
          {frequencyType === 'custom' && (
            <div className="ml-6 mt-1 flex flex-wrap gap-1">
              {dayNames.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={`
                    px-1.5 py-0.5 text-xs rounded-full
                    ${selectedDays.includes(index)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300'}
                  `}
                >
                  {day}
                </button>
              ))}
              {selectedDays.length === 0 && frequencyType === 'custom' && (
                <p className="text-xs text-red-500 mt-1">Please select at least one day</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 mt-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 shadow-sm text-xs rounded-md text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-700/70"
        >
          <XMarkIcon className="h-3 w-3 mr-1" />
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-2 py-1 border border-transparent text-xs rounded-md shadow-sm text-white bg-blue-600/80 hover:bg-blue-700/80"
          disabled={frequencyType === 'custom' && selectedDays.length === 0}
        >
          <CheckIcon className="h-3 w-3 mr-1" />
          Save
        </button>
      </div>
    </form>
  );
} 