import React from 'react';
import { Check } from 'lucide-react';

const Analytics = ({ habits }) => {
  // Get current week dates (Monday to Sunday)
  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Calculate offset to get Monday
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + mondayOffset + i);
      weekDates.push(date.toISOString().split('T')[0]); // Use YYYY-MM-DD format
    }
    return weekDates;
  };

  // Get weekly completion data for a habit
  const getWeeklyDataForHabit = (habit) => {
    const weekDates = getCurrentWeekDates();
    const today = new Date().toISOString().split('T')[0];
    
    return weekDates.map(date => {
      // Check if this date is in the past or today
      const dateObj = new Date(date);
      const todayObj = new Date(today);
      
      if (dateObj > todayObj) {
        // Future date - return null to indicate it's not available yet
        return null;
      }
      
      // Check if habit has completedDates array
      if (habit.completedDates && Array.isArray(habit.completedDates)) {
        return habit.completedDates.includes(date) ? 1 : 0;
      }
      
      // Fallback: Check if it's completed today using last_completed
      if (date === today) {
        return habit.last_completed === today ? 1 : 0;
      }
      
      // For past dates without completedDates array, return 0
      return 0;
    });
  };

  // Calculate dynamic weekly completion rate
  const calculateWeeklyCompletion = () => {
    if (habits.length === 0) return 0;
    
    const weekDates = getCurrentWeekDates();
    const today = new Date().toISOString().split('T')[0];
    
    // Only count days up to today
    const todayIndex = weekDates.findIndex(date => date === today);
    const daysPassedThisWeek = todayIndex >= 0 ? todayIndex + 1 : 7;
    
    const totalPossibleCompletions = habits.length * daysPassedThisWeek;
    const actualCompletions = habits.reduce((sum, habit) => {
      const weeklyData = getWeeklyDataForHabit(habit);
      // Only count completions up to today
      return sum + weeklyData.slice(0, daysPassedThisWeek).reduce((weekSum, day) => {
        return weekSum + (day === 1 ? 1 : 0);
      }, 0);
    }, 0);
    
    return totalPossibleCompletions > 0 ? Math.round((actualCompletions / totalPossibleCompletions) * 100) : 0;
  };

  // Calculate monthly completion rate (using completions vs target days)
  const calculateMonthlyCompletion = () => {
    if (habits.length === 0) return 0;
    
    const totalCompletions = habits.reduce((sum, habit) => sum + (habit.completions || 0), 0);
    const totalTargetDays = habits.reduce((sum, habit) => sum + Math.min(habit.target_days || 30, 30), 0);
    
    return totalTargetDays > 0 ? Math.round((totalCompletions / totalTargetDays) * 100) : 0;
  };

  const weeklyCompletion = calculateWeeklyCompletion();
  const monthlyCompletion = calculateMonthlyCompletion();
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Weekly Overview</h2>
        
        {/* Weekly Chart */}
        <div className="space-y-4">
          {habits.length > 0 ? (
            habits.map(habit => {
              const weeklyData = getWeeklyDataForHabit(habit);
              return (
                <div key={habit.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{habit.name}</span>
                    <span className="text-sm text-gray-500">{habit.streak || 0} days</span>
                  </div>
                  <div className="flex gap-1">
                    {weeklyData.map((completed, index) => (
                      <div
                        key={index}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium relative ${
                          completed === 1
                            ? `${habit.color} text-white` 
                            : completed === 0
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-gray-50 text-gray-300' // Future dates
                        }`}
                      >
                        {completed === 1 ? (
                          <Check size={14} className="text-white" />
                        ) : (
                          weekDays[index]
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 text-sm py-4">
              No habits added yet. Add your first habit to see weekly progress!
            </div>
          )}
        </div>
      </div>

      {/* Completion Timeline */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Completion Timeline</h2>
        <div className="space-y-3">
          {habits.length > 0 ? (
            <>
              <div className="text-center text-gray-500 text-sm py-2">
                📈 Your progress overview
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-green-700 font-medium">This Week</div>
                  <div className="text-green-600">{weeklyCompletion}% completion</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-blue-700 font-medium">This Month</div>
                  <div className="text-blue-600">{monthlyCompletion}% completion</div>
                </div>
              </div>
              
              {/* Additional Stats */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="text-lg font-bold text-gray-800">
                      {habits.reduce((sum, habit) => sum + (habit.completions || 0), 0)}
                    </div>
                    <div className="text-gray-500">Total Completions</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-800">
                      {habits.length > 0 ? Math.max(...habits.map(habit => habit.streak || 0)) : 0}
                    </div>
                    <div className="text-gray-500">Best Streak</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-800">{habits.length}</div>
                    <div className="text-gray-500">Active Habits</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 text-sm py-4">
              Start tracking habits to see your completion timeline
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;