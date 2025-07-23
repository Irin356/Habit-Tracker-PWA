//App.js - Updated with notification system
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, BarChart3, Plus, Activity, Bell, Settings as SettingsIcon, User, LogOut } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import AddHabitModal from './components/AddHabitModal';
import Profile from './components/Profile';
import Settings from './components/Settings';
import AuthWrapper from './components/AuthWrapper';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import './App.css';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Notification utility functions
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

const showNotification = (title, body, icon = '/favicon.ico') => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon,
      badge: '/favicon.ico',
      tag: 'habit-reminder',
      requireInteraction: true
    });
  }
};

const scheduleNotification = (time, habits) => {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);
  
  // If the time has passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  const timeDiff = scheduledTime.getTime() - now.getTime();
  
  return setTimeout(() => {
    const incompleteHabits = habits.filter(habit => !habit.last_completed);
    const habitCount = incompleteHabits.length;
    
    if (habitCount > 0) {
      showNotification(
        'HabTrack Reminder',
        `You have ${habitCount} habit${habitCount > 1 ? 's' : ''} to complete today!`,
        '/favicon.ico'
      );
    }
    
    // Schedule next notification for same time tomorrow
    scheduleNotification(time, habits);
  }, timeDiff);
};

// Main App Component (protected)
function MainApp() {
  const { user } = useAuth();
  
  const [habits, setHabits] = useState([]);
  const [habitCompletions, setHabitCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasCheckedForHabits, setHasCheckedForHabits] = useState(false);
  const [notificationTimeout, setNotificationTimeout] = useState(null);

  // User Profile State
  const [userProfile, setUserProfile] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
    goal: 'Build better habits daily',
    profilePicture: null,
    joinDate: new Date().toISOString(),
    notifications: true,
    darkMode: false,
    reminderTime: '02:08',
    weekStartsOn: 'monday'
  });

  const [currentView, setCurrentView] = useState('dashboard');
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Create default habits for new users
  const createDefaultHabits = useCallback(async () => {
    try {
      const { data: existingHabits, error: checkError } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id);

      if (checkError) throw checkError;
      
      if (existingHabits && existingHabits.length > 0) {
        return;
      }

      const defaultHabits = [
        {
          name: "Run 2.3 KM",
          icon: "🏃",
          color: "bg-orange-500",
          category: "fitness",
          target_days: 30,
          user_id: user.id
        },
        {
          name: "Don't Smoke",
          icon: "🚭",
          color: "bg-gray-600",
          category: "health",
          target_days: 365,
          user_id: user.id
        },
        {
          name: "Eat Healthy Meal",
          icon: "🥕",
          color: "bg-orange-500",
          category: "nutrition",
          target_days: 30,
          user_id: user.id
        },
        {
          name: "Brush Teeth",
          icon: "🦷",
          color: "bg-orange-500",
          category: "hygiene",
          target_days: 365,
          user_id: user.id
        },
        {
          name: "Walk the Dog",
          icon: "🐕",
          color: "bg-orange-500",
          category: "care",
          target_days: 30,
          user_id: user.id
        }
      ];

      const { data, error } = await supabase
        .from('habits')
        .insert(defaultHabits)
        .select();

      if (error) throw error;
      setHabits(data || []);
    } catch (error) {
      console.error('Error creating default habits:', error);
    }
  }, [user?.id]);

  // Load habits and completions from Supabase
  const loadHabitsAndCompletions = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;
      
      // Load completions
      const { data: completionsData, error: completionsError } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id);

      if (completionsError) throw completionsError;
      
      if (habitsData) {
        const uniqueHabits = habitsData.filter((habit, index, self) => 
          index === self.findIndex(h => h.name.toLowerCase() === habit.name.toLowerCase())
        );
        
        setHabits(uniqueHabits);
        setHabitCompletions(completionsData || []);
        setHasCheckedForHabits(true);
        
        if (uniqueHabits.length === 0 && !hasCheckedForHabits) {
          await createDefaultHabits();
        }
      }
    } catch (error) {
      console.error('Error loading habits and completions:', error);
      setHasCheckedForHabits(true);
    } finally {
      setLoading(false);
    }
  }, [user, hasCheckedForHabits, createDefaultHabits]);

  // Create user profile
  const createUserProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      // Get timezone from user metadata or fallback to detected timezone
      const userTimezone = user.user_metadata?.timezone || 
                          Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || '',
          email: user.email,
          goal: 'Build better habits daily',
          timezone: userTimezone,
          country: user.user_metadata?.country || null,
          signup_date: user.user_metadata?.signup_date || new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }, [user]);

  // Load user profile from Supabase
  const loadUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setUserProfile(prev => ({
          ...prev,
          name: data.name || prev.name,
          goal: data.goal || prev.goal,
          profilePicture: data.profile_picture || prev.profilePicture,
          notifications: data.notifications ?? prev.notifications,
          darkMode: data.dark_mode ?? prev.darkMode,
          reminderTime: data.reminder_time || prev.reminderTime,
          weekStartsOn: data.week_starts_on || prev.weekStartsOn
        }));
      } else {
        await createUserProfile();
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }, [user, createUserProfile]);

  // Setup notifications
  const setupNotifications = useCallback(async () => {
    // Clear existing timeout
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
      setNotificationTimeout(null);
    }

    if (!userProfile.notifications) {
      return;
    }

    // Request permission first
    const hasPermission = await requestNotificationPermission();
    
    if (!hasPermission) {
      console.log('Notification permission denied');
      return;
    }

    // Schedule notifications
    const timeout = scheduleNotification(userProfile.reminderTime, habitsWithCompletions);
    setNotificationTimeout(timeout);
    
    console.log(`Notifications scheduled for ${userProfile.reminderTime}`);
  }, [userProfile.notifications, userProfile.reminderTime, habits]);

  // Update profile when user changes
  useEffect(() => {
    if (user) {
      setUserProfile(prev => ({
        ...prev,
        name: user.user_metadata?.name || prev.name,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadHabitsAndCompletions();
      loadUserProfile();
    }
  }, [user, loadHabitsAndCompletions, loadUserProfile]);

  // Setup notifications when profile or habits change
  useEffect(() => {
    if (habits.length > 0) {
      setupNotifications();
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (notificationTimeout) {
        clearTimeout(notificationTimeout);
      }
    };
  }, [setupNotifications]);

  // Helper function to get completions for a habit
  const getHabitCompletions = (habitId) => {
    return habitCompletions.filter(completion => completion.habit_id === habitId);
  };

  // Calculate consecutive streak from completion dates
  const calculateStreak = (completions) => {
    if (!completions || completions.length === 0) return 0;
    
    const today = new Date();
    const completionDates = completions.map(c => new Date(c.completed_date));
    completionDates.sort((a, b) => b - a); // Sort descending
    
    let streak = 0;
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toISOString().split('T')[0];
      
      const hasCompletion = completionDates.some(date => 
        date.toISOString().split('T')[0] === dateString
      );
      
      if (hasCompletion) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Enhanced habits with completion data
  const habitsWithCompletions = habits.map(habit => {
    const completions = getHabitCompletions(habit.id);
    const userTimezone = userProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const today = new Date();
    const userToday = new Date(today.toLocaleString("en-US", { timeZone: userTimezone }));
    const todayString = userToday.toISOString().split('T')[0];
    
    const todayCompletion = completions.find(c => 
      new Date(c.completed_date).toISOString().split('T')[0] === todayString
    );
    
    return {
      ...habit,
      completions: completions.length,
      streak: calculateStreak(completions),
      completed_dates: completions.map(c => new Date(c.completed_date).toISOString().split('T')[0]),
      last_completed: todayCompletion ? todayString : null
    };
  });

  // Dynamic stats calculation
  const calculateStats = () => {
    const totalCompletions = habitCompletions.length;
    const bestStreak = habitsWithCompletions.length > 0 ? 
      Math.max(...habitsWithCompletions.map(habit => habit.streak)) : 0;
    const completionRate = habits.length > 0 ? 
      (totalCompletions / (habits.length * 30)) * 100 : 0;
    
    return { 
      totalCompletions, 
      bestStreak, 
      completionRate: Math.round(completionRate * 10) / 10
    };
  };

  const stats = calculateStats();
  const today = new Date().toISOString().split('T')[0];

  // Toggle habit completion
  const toggleHabit = async (habitId) => {
    if (!user || !habitId) {
      console.error('Missing user or habitId');
      alert('Authentication error. Please try signing in again.');
      return;
    }

    try {
      // Get user's timezone
      const userTimezone = userProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Get today's date in user's timezone
      const today = new Date();
      const userToday = new Date(today.toLocaleString("en-US", { timeZone: userTimezone }));
      const todayString = userToday.toISOString().split('T')[0];

      console.log('User timezone:', userTimezone);
      console.log('Today in user timezone:', todayString);

      const existingCompletion = habitCompletions.find(completion => 
        completion.habit_id === habitId && 
        new Date(completion.completed_date).toISOString().split('T')[0] === todayString
      );

      if (existingCompletion) {
        // Remove completion
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existingCompletion.id);

        if (error) throw error;

        setHabitCompletions(prev => 
          prev.filter(completion => completion.id !== existingCompletion.id)
        );
      } else {
        // Add completion with user's timezone date
        const { data, error } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            completed_date: todayString
          })
          .select()
          .single();

        if (error) throw error;

        setHabitCompletions(prev => [...prev, data]);
      }

      console.log('Habit completion toggled successfully:', habitId);
      
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      alert(`Failed to update habit: ${error.message || 'Unknown error'}`);
    }
  };

  // Fixed addHabit function
  const addHabit = async (habitData) => {
    if (!user) {
      console.error('No user found');
      alert('Please sign in to add habits.');
      return;
    }

    // Check for duplicate habit names
    const existingHabit = habits.find(h => 
      h.name.toLowerCase().trim() === habitData.name.toLowerCase().trim()
    );
    
    if (existingHabit) {
      alert('A habit with this name already exists. Please choose a different name.');
      return;
    }

    // Validate habit data
    if (!habitData.name || !habitData.name.trim()) {
      alert('Please enter a habit name.');
      return;
    }

    // Prepare the habit data for Supabase
    const newHabit = {
      name: habitData.name.trim(),
      icon: habitData.icon || '✅',
      color: habitData.color || 'bg-green-500',
      category: habitData.category || 'general',
      target_days: habitData.targetDays || 30,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    console.log('Adding habit:', newHabit);

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert([newHabit])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Habit added successfully:', data);
      setHabits(prev => [...prev, data]);
      
      // Show success message
      alert('Habit added successfully!');
      
    } catch (error) {
      console.error('Error adding habit:', error);
      
      // Provide more specific error messages
      if (error.code === '23505') {
        alert('A habit with this name already exists.');
      } else if (error.code === '23502') {
        alert('Please fill in all required fields.');
      } else if (error.message.includes('auth')) {
        alert('Authentication error. Please sign in again.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert(`Failed to add habit: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const updateHabit = async (habitId, updates) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

      setHabits(prev => prev.map(habit => 
        habit.id === habitId 
          ? { ...habit, ...updates }
          : habit
      ));
    } catch (error) {
      console.error('Error updating habit:', error);
      alert('Failed to update habit. Please try again.');
    }
  };

  const deleteHabit = async (habitId) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

      setHabits(prev => prev.filter(habit => habit.id !== habitId));
      setHabitCompletions(prev => prev.filter(completion => completion.habit_id !== habitId));
    } catch (error) {
      console.error('Error deleting habit:', error);
      alert('Failed to delete habit. Please try again.');
    }
  };

  const updateProfile = async (newProfile) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          name: newProfile.name,
          email: newProfile.email,
          goal: newProfile.goal,
          profile_picture: newProfile.profilePicture,
          notifications: newProfile.notifications,
          dark_mode: newProfile.darkMode,
          reminder_time: newProfile.reminderTime,
          week_starts_on: newProfile.weekStartsOn
        });

      if (error) throw error;
      
      setUserProfile(newProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const clearAllData = async () => {
    if (!user) return;

    try {
      const { error: habitsError } = await supabase
        .from('habits')
        .delete()
        .eq('user_id', user.id);

      if (habitsError) throw habitsError;

      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      setHabits([]);
      setHabitCompletions([]);
      setHasCheckedForHabits(false);
      setUserProfile({
        name: user?.user_metadata?.name || '',
        email: user?.email || '',
        goal: 'Build better habits daily',
        profilePicture: null,
        joinDate: new Date().toISOString(),
        notifications: true,
        darkMode: false,
        reminderTime: '02:08',
        weekStartsOn: 'monday'
      });
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to clear data. Please try again.');
    }
  };

  const resetApp = async () => {
    await clearAllData();
    await createUserProfile();
  };

  const handleSignOut = async () => {
    try {
      console.log('Signing out user...');
      
      // Clear notification timeout
      if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        setNotificationTimeout(null);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      setHabits([]);
      setHabitCompletions([]);
      setHasCheckedForHabits(false);
      setCurrentView('dashboard');
      setShowAddHabit(false);
      setShowSettings(false);
      
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-sky-500">HabTrack</h1>
            <p className="text-sm text-gray-600">Build better habits daily</p>
          </div>
          <div className="flex gap-2 items-center">
            <button 
              className={`p-2 rounded-lg transition-colors ${
                userProfile.notifications 
                  ? 'text-blue-500 bg-blue-50' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => {
                if (!userProfile.notifications) {
                  alert('Enable notifications in settings to get reminders!');
                  setShowSettings(true);
                }
              }}
            >
              <Bell size={20} />
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <SettingsIcon size={20} />
            </button>
            <button 
              onClick={handleSignOut}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
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
            habits={habitsWithCompletions}
            stats={stats}
            onToggleHabit={toggleHabit}
            onShowAddHabit={() => setShowAddHabit(true)}
            onUpdateHabit={updateHabit}
            onDeleteHabit={deleteHabit}
          />
        )}
        {currentView === 'analytics' && <Analytics habits={habitsWithCompletions} />}
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

// Root App Component with Auth Provider
function App() {
  return (
    <AuthProvider>
      <AppContent />
      <SpeedInsights />
    </AuthProvider>
  );
}

// App Content Component that checks auth state
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <MainApp /> : <AuthWrapper />;
}

export default App;