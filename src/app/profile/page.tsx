'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useHabits } from '@/lib/HabitContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { exportData, getQuarterlySummary } = useHabits();
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleExport = async () => {
    try {
      setLoading(true);
      const data = await exportData(startDate || undefined, endDate || undefined);
      
      // Convert to CSV
      const headers = ['Date', 'Habit', 'Category', 'Completed'];
      const csvRows = [headers.join(',')];
      
      data.forEach((item: any) => {
        const row = [
          item.date,
          item.habits?.title || 'Unknown',
          item.habit_categories?.name || 'Unknown',
          item.completed ? 'Yes' : 'No'
        ];
        csvRows.push(row.join(','));
      });
      
      const csvString = csvRows.join('\n');
      
      // Create download
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `habit-data-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetSummary = async () => {
    try {
      setLoading(true);
      const data = await getQuarterlySummary(year, quarter);
      setSummary(data);
    } catch (error) {
      console.error('Error getting summary:', error);
      alert('Error getting summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="glass p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Profile</h1>
            <button
              onClick={handleSignOut}
              className="py-2 px-4 bg-white bg-opacity-10 hover:bg-opacity-20 rounded transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-lg">Email: {user.email}</p>
          </div>
        </div>
        
        <div className="glass p-8 mb-8">
          <h2 className="text-xl font-bold mb-4">Export Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date (Optional)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 rounded bg-white bg-opacity-10 border border-white border-opacity-20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 rounded bg-white bg-opacity-10 border border-white border-opacity-20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-40"
              />
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={loading}
            className="py-2 px-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-all duration-200 font-medium disabled:opacity-50"
          >
            {loading ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>
        
        <div className="glass p-8">
          <h2 className="text-xl font-bold mb-4">Quarterly Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full p-2 rounded bg-white bg-opacity-10 border border-white border-opacity-20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quarter</label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(parseInt(e.target.value))}
                className="w-full p-2 rounded bg-white bg-opacity-10 border border-white border-opacity-20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-40"
              >
                <option value={1}>Q1 (Jan-Mar)</option>
                <option value={2}>Q2 (Apr-Jun)</option>
                <option value={3}>Q3 (Jul-Sep)</option>
                <option value={4}>Q4 (Oct-Dec)</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleGetSummary}
            disabled={loading}
            className="py-2 px-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-all duration-200 font-medium disabled:opacity-50 mb-4"
          >
            {loading ? 'Loading...' : 'Get Summary'}
          </button>
          
          {summary && (
            <div className="mt-6 p-4 bg-white bg-opacity-10 rounded">
              <h3 className="text-lg font-bold mb-2">{summary.period} Summary</h3>
              <p>Total Habits: {summary.totalHabits}</p>
              <p>Total Completions: {summary.totalCompletions}</p>
              <p>Overall Completion Rate: {summary.completionRate.toFixed(1)}%</p>
              
              <h4 className="text-md font-bold mt-4 mb-2">Category Breakdown:</h4>
              {Object.entries(summary.categoryBreakdown).map(([category, data]: [string, any]) => (
                <div key={category} className="mb-2">
                  <p>{category}: {data.completed}/{data.total} ({data.rate.toFixed(1)}%)</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 