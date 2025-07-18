//Dashboard.js
import React from 'react';
import { Plus, Flame, Target, TrendingUp } from 'lucide-react';
import HabitCard from './HabitCard';

const Dashboard = ({ habits, stats, onToggleHabit, onShowAddHabit, onUpdateHabit, onDeleteHabit }) => {
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Today's Progress</h2>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-800">{stats.bestStreak}</div>
            <div className="text-sm text-gray-500">Best Streak</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{stats.completionRate}%</div>
            <div className="text-sm text-gray-500">All Time</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalCompletions}</div>
            <div className="text-sm text-gray-500">Completions</div>
          </div>
        </div>
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-2 gap-4">
        {habits.map(habit => (
          <HabitCard 
            key={habit.id} 
            habit={habit} 
            onToggle={onToggleHabit} 
            onUpdateHabit={onUpdateHabit}
            onDeleteHabit={onDeleteHabit}
          />
        ))}
        
        {/* Add Habit Card */}
        <button
          onClick={onShowAddHabit}
          className="bg-gray-100 rounded-3xl p-6 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors min-h-[180px]"
        >
          <Plus size={32} className="mb-2" />
          <span className="font-medium">Add a Habit</span>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;