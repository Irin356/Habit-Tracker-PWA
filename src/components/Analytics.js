import React, { useState, useRef, useEffect } from 'react';
import { Check, TrendingUp, Calendar, Target, ChevronLeft, ChevronRight } from 'lucide-react';

const Analytics = ({ habits = [], userProfile = {} }) => {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // This function now works because userProfile is a prop
  const getUserTimezone = () => {
    return userProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  const formatDateInTimezone = (date, timezone = getUserTimezone()) => {
    return new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  };

  // Updated getCurrentWeekDates function
  const getCurrentWeekDates = () => {
    const userTimezone = getUserTimezone();
    const today = new Date();
    const localToday = new Date(today.toLocaleString("en-US", { timeZone: userTimezone }));
    
    // Use weekStartsOn from userProfile, defaulting to 'monday'
    const weekStartsOnMonday = userProfile?.settings?.weekStartsOn === 'monday';
    const currentDay = localToday.getDay(); // Sunday: 0, Monday: 1, etc.

    let mondayOffset;
    if (weekStartsOnMonday) {
        mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Monday is the first day
    } else {
        mondayOffset = -currentDay; // Sunday is the first day
    }

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(localToday);
      date.setDate(localToday.getDate() + mondayOffset + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }
    return weekDates;
  };

  // Get all 12 months of current year
  const getAllMonthsOfYear = () => {
    const months = [];
    const currentYear = new Date().getFullYear();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, i, 1);
      months.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        fullName: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        year: date.getFullYear(),
        month: date.getMonth(),
        date: date
      });
    }
    return months;
  };

  // Calculate monthly completion data for each habit
  const getMonthlyCompletionData = () => {
    const months = getAllMonthsOfYear();
    
    return months.map(monthInfo => {
      const monthData = {
        month: monthInfo.name,
        fullName: monthInfo.fullName,
        totalHabits: habits.length,
        habitCompletions: {}
      };

      // Calculate completions for each habit in this month
      habits.forEach(habit => {
        const completionsInMonth = (habit.completed_dates || []).filter(dateStr => {
          const completionDate = new Date(dateStr);
          return completionDate.getMonth() === monthInfo.month && 
                 completionDate.getFullYear() === monthInfo.year;
        }).length;

        // Get days in month
        const daysInMonth = new Date(monthInfo.year, monthInfo.month + 1, 0).getDate();
        const today = new Date();
        const isCurrentMonth = monthInfo.month === today.getMonth() && 
                               monthInfo.year === today.getFullYear();
        const daysToCount = isCurrentMonth ? today.getDate() : daysInMonth;

        // For future months, don't count any days
        const isFutureMonth = monthInfo.year > today.getFullYear() || 
                              (monthInfo.year === today.getFullYear() && monthInfo.month > today.getMonth());
        
        monthData.habitCompletions[habit.id] = {
          completed: completionsInMonth,
          possible: isFutureMonth ? 0 : daysToCount,
          percentage: (!isFutureMonth && daysToCount > 0) ? Math.round((completionsInMonth / daysToCount) * 100) : 0,
          isFuture: isFutureMonth
        };
      });

      // Calculate overall monthly completion
      const totalPossible = Object.values(monthData.habitCompletions)
        .reduce((sum, habit) => sum + habit.possible, 0);
      const totalCompleted = Object.values(monthData.habitCompletions)
        .reduce((sum, habit) => sum + habit.completed, 0);

      monthData.overallPercentage = totalPossible > 0 ? 
        Math.round((totalCompleted / totalPossible) * 100) : 0;
      monthData.totalCompleted = totalCompleted;
      monthData.totalPossible = totalPossible;
      monthData.isFuture = Object.values(monthData.habitCompletions).every(habit => habit.isFuture);

      return monthData;
    });
  };

  // Get weekly completion data for a habit
  const getWeeklyDataForHabit = (habit) => {
    const weekDates = getCurrentWeekDates();
    const userTimezone = getUserTimezone();
    const today = new Date();
    const localToday = new Date(today.toLocaleString("en-US", {timeZone: userTimezone}));
    const todayString = localToday.toISOString().split('T')[0];
    
    return weekDates.map(date => {
      const dateObj = new Date(date + 'T00:00:00');
      const todayObj = new Date(todayString + 'T00:00:00');
      
      if (dateObj > todayObj) {
        return null; // Future date
      }
      
      if (habit.completed_dates && Array.isArray(habit.completed_dates)) {
        return habit.completed_dates.some(completedDate => {
          // Convert completed date to user timezone before comparing
          const completedDateObj = new Date(completedDate);
          const localCompletedDate = new Date(completedDateObj.toLocaleString("en-US", {timeZone: userTimezone}));
          return localCompletedDate.toISOString().split('T')[0] === date;
        }) ? 1 : 0;
      }
      
      // Fallback for older data structure
      if (date === todayString) {
        return habit.last_completed === todayString ? 1 : 0;
      }
      
      return 0;
    });
  };


  // Calculate dynamic weekly completion rate
  const calculateWeeklyCompletion = () => {
    if (habits.length === 0) return 0;
    
    const weekDates = getCurrentWeekDates();
    const userTimezone = getUserTimezone();
    const today = formatDateInTimezone(new Date(), userTimezone);
    const todayString = today.toISOString().split('T')[0];
    
    const todayIndex = weekDates.findIndex(date => date === todayString);
    const daysPassedThisWeek = todayIndex >= 0 ? todayIndex + 1 : 7;
    
    const totalPossibleCompletions = habits.length * daysPassedThisWeek;
    const actualCompletions = habits.reduce((sum, habit) => {
      const weeklyData = getWeeklyDataForHabit(habit);
      return sum + weeklyData.slice(0, daysPassedThisWeek).reduce((weekSum, day) => {
        return weekSum + (day === 1 ? 1 : 0);
      }, 0);
    }, 0);
    
    return totalPossibleCompletions > 0 ? Math.round((actualCompletions / totalPossibleCompletions) * 100) : 0;
  };

  // Calculate monthly completion rate (using completions vs target days)
  const calculateMonthlyCompletion = () => {
    if (habits.length === 0) return 0;
    
    const totalCompletions = habits.reduce((sum, habit) => sum + (habit.completed_dates?.length || 0), 0);
    const totalPossibleCompletions = habits.reduce((sum, habit) => {
        const creationDate = new Date(habit.created_at);
        const today = new Date();
        const diffTime = Math.abs(today - creationDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return sum + diffDays;
    }, 0);
    
    return totalPossibleCompletions > 0 ? Math.round((totalCompletions / totalPossibleCompletions) * 100) : 0;
  };

  // Handle scroll functionality
  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200; // Adjust scroll amount as needed
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  // Update scroll button states
  const updateScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < (container.scrollWidth - container.clientWidth - 5)
    );
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
        container.addEventListener('scroll', updateScrollButtons);
        updateScrollButtons(); // Initial check
    }
    return () => {
        if (container) {
            container.removeEventListener('scroll', updateScrollButtons);
        }
    };
  }, [habits]); // Re-check when habits change

  const weeklyCompletion = calculateWeeklyCompletion();
  const monthlyCompletion = calculateMonthlyCompletion();
  const monthlyData = getMonthlyCompletionData();
  const weekDayLabels = userProfile?.settings?.weekStartsOn === 'monday'
    ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] 
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Find best and worst performing months (exclude future months)
  const pastMonths = monthlyData.filter(month => !month.isFuture);
  const bestMonth = pastMonths.length > 0 ? pastMonths.reduce((best, month) => 
    month.overallPercentage > best.overallPercentage ? month : best, 
    pastMonths[0]
  ) : { overallPercentage: 0, month: 'N/A', totalCompleted: 0, totalPossible: 0 };

  const currentMonth = monthlyData.find(month => {
    const today = new Date();
    return month.month === today.toLocaleDateString('en-US', { month: 'short' });
  }) || monthlyData[new Date().getMonth()];

  const lastMonthIndex = new Date().getMonth() - 1;
  const lastMonth = lastMonthIndex >= 0 ? monthlyData[lastMonthIndex] : null;
  const monthlyTrend = currentMonth && lastMonth && !lastMonth.isFuture ? 
    currentMonth.overallPercentage - lastMonth.overallPercentage : 0;

  if (habits.length === 0) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center text-gray-500">
            <Calendar size={32} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No Analytics Yet</h3>
            <p className="text-sm mt-1">Start tracking your habits to see your progress here!</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Weekly Overview</h2>
        
        <div className="space-y-4">
          {habits.map(habit => {
              const weeklyData = getWeeklyDataForHabit(habit);
              return (
                <div key={habit.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{habit.name}</span>
                    <span className="text-sm text-gray-500">{habit.streak || 0} days</span>
                  </div>
                  <div className="flex justify-between gap-1">
                    {weeklyData.map((completed, index) => (
                      <div
                        key={index}
                        className={`w-full h-8 rounded-lg flex items-center justify-center text-xs font-medium relative ${
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
                          weekDayLabels[index]
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Yearly Progress Graph with Horizontal Scroll */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Yearly Progress ({new Date().getFullYear()})</h2>
          {monthlyTrend !== 0 && !currentMonth?.isFuture && (
            <div className={`flex items-center gap-1 text-sm ${
              monthlyTrend > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp size={14} className={monthlyTrend < 0 ? 'transform rotate-180' : ''} />
              <span>{Math.abs(monthlyTrend)}% vs last month</span>
            </div>
          )}
        </div>
        
        <>
            {/* Scrollable Monthly Graph */}
            <div className="relative">
              {/* Scroll Buttons */}
              <button
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center transition-opacity ${
                  canScrollLeft ? 'opacity-100 text-gray-700 hover:bg-gray-50' : 'opacity-0'
                }`}
              >
                <ChevronLeft size={16} />
              </button>
              
              <button
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center transition-opacity ${
                  canScrollRight ? 'opacity-100 text-gray-700 hover:bg-gray-50' : 'opacity-0'
                }`}
              >
                <ChevronRight size={16} />
              </button>

              {/* Scrollable Container */}
              <div 
                ref={scrollContainerRef}
                className="overflow-x-auto scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="flex items-end justify-start h-32 gap-3 pb-8 min-w-max px-2">
                  {monthlyData.map((month, index) => {
                    const isCurrentMonth = index === new Date().getMonth();
                    const isFutureMonth = month.isFuture;
                    
                    return (
                      <div key={index} className="flex-shrink-0 flex flex-col items-center w-12 group">
                        <div className="text-xs mb-1 text-gray-500 group-hover:font-semibold">
                          {isFutureMonth ? '-' : `${month.overallPercentage}%`}
                        </div>
                        <div 
                          className={`w-full bg-gray-100 rounded-t-lg relative overflow-hidden transition-all duration-300 ${
                            isCurrentMonth ? 'ring-2 ring-blue-400' : ''
                          }`} 
                          style={{ height: '100px' }}
                        >
                          <div
                            className={`w-full absolute bottom-0 rounded-t-lg transition-all duration-500 group-hover:opacity-80 ${
                              isFutureMonth 
                                ? 'bg-gray-200' 
                                : 'bg-gradient-to-t from-blue-500 to-blue-400'
                            }`}
                            style={{ 
                              height: isFutureMonth ? '0%' : `${month.overallPercentage}%`,
                              minHeight: (!isFutureMonth && month.overallPercentage > 0) ? '4px' : '0px'
                            }}
                          />
                        </div>
                        <span className={`text-xs mt-2 w-full text-center ${
                          isCurrentMonth ? 'text-blue-600 font-semibold' : 'text-gray-500'
                        }`}>
                          {month.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mt-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={16} className="text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">This Month</span>
                </div>
                <div className="text-lg font-bold text-blue-800">
                  {currentMonth?.isFuture ? 'Upcoming' : `${currentMonth?.overallPercentage || 0}%`}
                </div>
                <div className="text-xs text-blue-600">
                  {currentMonth?.totalCompleted || 0}/{currentMonth?.totalPossible || 0} completed
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Target size={16} className="text-green-600" />
                  <span className="text-sm text-green-700 font-medium">Best Month</span>
                </div>
                <div className="text-lg font-bold text-green-800">
                  {bestMonth?.overallPercentage || 0}%
                </div>
                <div className="text-xs text-green-600">
                  {bestMonth?.month} - {bestMonth?.totalCompleted}/{bestMonth?.totalPossible}
                </div>
              </div>
            </div>

            {/* Habit-wise Monthly Performance */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Habit Performance This Month
                {currentMonth?.isFuture && <span className="text-gray-400 font-normal"> (Not started yet)</span>}
              </h3>
              {habits.map(habit => {
                const habitData = currentMonth?.habitCompletions[habit.id];
                return (
                  <div key={habit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${habit.color}`} />
                      <span className="text-sm font-medium">{habit.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {habitData?.isFuture ? '-' : `${habitData?.percentage || 0}%`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {habitData?.completed || 0}/{habitData?.possible || 0} days
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
      </div>

      {/* Completion Timeline */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Overall Stats</h2>
        <div className="space-y-3">
          <>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-green-700 font-medium">This Week</div>
                <div className="text-green-800 font-bold text-lg">{weeklyCompletion}%</div>
                <div className="text-green-600 text-xs">Completion Rate</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-blue-700 font-medium">Overall</div>
                <div className="text-blue-800 font-bold text-lg">{monthlyCompletion}%</div>
                <div className="text-blue-600 text-xs">Completion Rate</div>
              </div>
            </div>
            
            {/* Additional Stats */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="text-lg font-bold text-gray-800">
                    {habits.reduce((sum, habit) => sum + (habit.completed_dates?.length || 0), 0)}
                  </div>
                  <div className="text-gray-500">Total Done</div>
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
        </div>
      </div>

      {/* Hide scrollbar globally for this component */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Analytics;