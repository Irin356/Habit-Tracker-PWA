import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, Plus, Activity, Bell, Settings as SettingsIcon, User } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import AddHabitModal from './components/AddHabitModal';
import Profile from './components/Profile';
import Settings from './components/Settings';
import './App.css';

function App() {
  const [habits, setHabits] = useState([
    {
      id: 1,
      name: "Run 2.3 KM",
      icon: "🏃",
      color: "bg-orange-500",
      streak: 0,
      completions: 0,
      targetDays: 30,
      category: "fitness",
      lastCompleted: null,
      completedDates: [] // Track all completion dates
    },
    {
      id: 2,
      name: "Don't Smoke",
      icon: "🚭",
      color: "bg-gray-600",
      streak: 0,
      completions: 0,
      targetDays: 365,
      category: "health",
      lastCompleted: null,
      completedDates: []
    },
    {
      id: 3,
      name: "Eat Healthy Meal",
      icon: "🥕",
      color: "bg-orange-500",
      streak: 0,
      completions: 0,
      targetDays: 30,
      category: "nutrition",
      lastCompleted: null,
      completedDates: []
    },
    {
      id: 4,
      name: "Brush Teeth",
      icon: "🦷",
      color: "bg-orange-500",
      streak: 0,
      completions: 0,
      targetDays: 365,
      category: "hygiene",
      lastCompleted: null,
      completedDates: []
    },
    {
      id: 5,
      name: "Walk the Dog",
      icon: "🐕",
      color: "bg-orange-500",
      streak: 0,
      completions: 0,
      targetDays: 30,
      category: "care",
      lastCompleted: null,
      completedDates: []
    }
  ]);

  // User Profile State
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    goal: 'Build better habits daily',
    profilePicture: null,
    joinDate: new Date().toISOString(),
    notifications: true,
    darkMode: false,
    reminderTime: '09:00',
    weekStartsOn: 'monday'
  });

  const [currentView, setCurrentView] = useState('dashboard');
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedHabits = localStorage.getItem('habitTrackerHabits');
    const savedProfile = localStorage.getItem('habitTrackerProfile');
    
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits));
    }
    
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
  }, []);

  // Save to localStorage whenever habits or profile changes
  useEffect(() => {
    localStorage.setItem('habitTrackerHabits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('habitTrackerProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Dynamic stats calculation function
  const calculateStats = () => {
    const totalCompletions = habits.reduce((sum, habit) => sum + habit.completions, 0);
    const bestStreak = habits.length > 0 ? Math.max(...habits.map(habit => habit.streak)) : 0;
    const completionRate = habits.length > 0 ? (totalCompletions / (habits.length * 30)) * 100 : 0;
    
    return { 
      totalCompletions, 
      bestStreak, 
      completionRate: Math.round(completionRate * 10) / 10
    };
  };

  // Calculate consecutive streak from completion dates
  const calculateStreak = (completedDates) => {
    if (!completedDates || completedDates.length === 0) return 0;
    
    const today = new Date();
    let streak = 0;
    
    // Check consecutive days backwards from today
    for (let i = 0; i < 365; i++) { // Max check 365 days
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();
      
      if (completedDates.includes(dateString)) {
        streak++;
      } else {
        break; // Break streak if day not found
      }
    }
    
    return streak;
  };

  const stats = calculateStats();
  const today = new Date().toDateString();

  const toggleHabit = (habitId) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        const isCompleted = habit.lastCompleted === today;
        let newCompletedDates = [...(habit.completedDates || [])];
        
        if (isCompleted) {
          // Remove today's completion
          newCompletedDates = newCompletedDates.filter(date => date !== today);
        } else {
          // Add today's completion
          if (!newCompletedDates.includes(today)) {
            newCompletedDates.push(today);
          }
        }
        
        // Recalculate streak based on updated completion dates
        const newStreak = calculateStreak(newCompletedDates);
        
        return {
          ...habit,
          lastCompleted: isCompleted ? null : today,
          streak: newStreak,
          completions: newCompletedDates.length,
          completedDates: newCompletedDates
        };
      }
      return habit;
    }));
  };

  const addHabit = (habit) => {
    const newHabit = {
      ...habit,
      completedDates: [] // Initialize with empty completion dates
    };
    setHabits(prev => [...prev, newHabit]);
  };
  const updateHabit = (habitId, updates) => {
  setHabits(prev => prev.map(habit => 
    habit.id === habitId 
      ? { ...habit, ...updates }
      : habit
  ));
  };

  const updateProfile = (newProfile) => {
    setUserProfile(newProfile);
  };

  const clearAllData = () => {
    localStorage.removeItem('habitTrackerHabits');
    localStorage.removeItem('habitTrackerProfile');
    setHabits([]);
    setUserProfile({
      name: '',
      email: '',
      goal: 'Build better habits daily',
      profilePicture: null,
      joinDate: new Date().toISOString(),
      notifications: true,
      darkMode: false,
      reminderTime: '09:00',
      weekStartsOn: 'monday'
    });
  };

  const resetApp = () => {
    clearAllData();
    // Reset to initial habits
    const initialHabits = [
      {
        id: 1,
        name: "Run 2.3 KM",
        icon: "🏃",
        color: "bg-orange-500",
        streak: 0,
        completions: 0,
        targetDays: 30,
        category: "fitness",
        lastCompleted: null,
        completedDates: []
      },
      {
        id: 2,
        name: "Don't Smoke",
        icon: "🚭",
        color: "bg-gray-600",
        streak: 0,
        completions: 0,
        targetDays: 365,
        category: "health",
        lastCompleted: null,
        completedDates: []
      },
      {
        id: 3,
        name: "Eat Healthy Meal",
        icon: "🥕",
        color: "bg-orange-500",
        streak: 0,
        completions: 0,
        targetDays: 30,
        category: "nutrition",
        lastCompleted: null,
        completedDates: []
      },
      {
        id: 4,
        name: "Brush Teeth",
        icon: "🦷",
        color: "bg-orange-500",
        streak: 0,
        completions: 0,
        targetDays: 365,
        category: "hygiene",
        lastCompleted: null,
        completedDates: []
      },
      {
        id: 5,
        name: "Walk the Dog",
        icon: "🐕",
        color: "bg-orange-500",
        streak: 0,
        completions: 0,
        targetDays: 30,
        category: "care",
        lastCompleted: null,
        completedDates: []
      }
    ];
    setHabits(initialHabits);
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Habits</h1>
            <p className="text-sm text-gray-600">Build better habits daily</p>
          </div>
          <div className="flex gap-2 items-center">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Bell size={20} />
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <SettingsIcon size={20} />
            </button>
            {/* Profile Picture in Header */}
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ml-2">
              {userProfile.profilePicture ? (
                <img
                  src={userProfile.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={16} className="text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20">
        {currentView === 'dashboard' && (
          <Dashboard 
            habits={habits}
            stats={stats}
            onToggleHabit={toggleHabit}
            onShowAddHabit={() => setShowAddHabit(true)}
            onUpdateHabit={updateHabit}
          />
        )}
        {currentView === 'analytics' && <Analytics habits={habits} />}
        {currentView === 'profile' && (
          <Profile 
            userProfile={userProfile}
            onUpdateProfile={updateProfile}
            stats={stats}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg ${
              currentView === 'dashboard' 
                ? 'text-blue-500 bg-blue-50' 
                : 'text-gray-500'
            }`}
          >
            <Calendar size={20} />
            <span className="text-xs mt-1">Today</span>
          </button>
          
          <button
            onClick={() => setCurrentView('analytics')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg ${
              currentView === 'analytics' 
                ? 'text-blue-500 bg-blue-50' 
                : 'text-gray-500'
            }`}
          >
            <BarChart3 size={20} />
            <span className="text-xs mt-1">Analytics</span>
          </button>

          <button
            onClick={() => setShowAddHabit(true)}
            className="flex flex-col items-center py-2 px-4 rounded-lg text-gray-500 hover:text-blue-500"
          >
            <Plus size={20} />
            <span className="text-xs mt-1">Add</span>
          </button>

          <button 
            onClick={() => setCurrentView('profile')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg ${
              currentView === 'profile' 
                ? 'text-blue-500 bg-blue-50' 
                : 'text-gray-500'
            }`}
          >
            <Activity size={20} />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>

      {/* Add Habit Modal */}
      <AddHabitModal 
        isOpen={showAddHabit}
        onClose={() => setShowAddHabit(false)}
        onAddHabit={addHabit}
      />

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userProfile={userProfile}
        onUpdateProfile={updateProfile}
        onClearAllData={clearAllData}
        onResetApp={resetApp}
      />
    </div>
  );
}

export default App;