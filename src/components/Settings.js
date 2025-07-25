//Settings.js - Improved with notification permission handling
import React, { useState, useEffect } from 'react';
import { X, Bell, Moon, Trash2, Download, Upload, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Settings = ({ isOpen, onClose, userProfile, onUpdateProfile, onClearAllData, onResetApp }) => {
  const { user } = useAuth();
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [settings, setSettings] = useState({
    notifications: userProfile.notifications || false,
    darkMode: userProfile.darkMode || false,
    reminderTime: userProfile.reminderTime || '08:00',
    weekStartsOn: userProfile.weekStartsOn || 'monday'
  });

  // Check notification permission status
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [isOpen]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        // Test notification
        new Notification('HabTrack Notifications Enabled!', {
          body: 'You will now receive daily habit reminders.',
          icon: '/favicon.ico',
          tag: 'permission-granted'
        });
        return true;
      } else {
        alert('Please enable notifications in your browser settings to receive reminders.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const handleNotificationToggle = async (enabled) => {
    if (enabled && notificationPermission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        return; // Don't update settings if permission denied
      }
    }
    
    setSettings(prev => ({ ...prev, notifications: enabled }));
  };

  const handleSave = () => {
    onUpdateProfile({ ...userProfile, ...settings });
    onClose();
  };

  const handleExportData = async () => {
    if (!user) return;
    
    try {
      // Get habits from Supabase
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      if (habitsError) throw habitsError;

      // Get user profile from Supabase
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      const data = {
        habits: habits || [],
        profile: profile || userProfile,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Clear existing data first
        await onClearAllData();
        
        // Import habits if they exist
        if (data.habits && data.habits.length > 0) {
          const habitsToImport = data.habits.map(habit => ({
            ...habit,
            user_id: user.id,
            id: undefined // Remove old ID to create new ones
          }));

          const { error: habitsError } = await supabase
            .from('habits')
            .insert(habitsToImport);

          if (habitsError) throw habitsError;
        }

        // Import profile if it exists
        if (data.profile) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              user_id: user.id,
              name: data.profile.name || userProfile.name,
              email: data.profile.email || userProfile.email,
              goal: data.profile.goal || userProfile.goal,
              profile_picture: data.profile.profile_picture || userProfile.profilePicture,
              settings: data.profile.settings || {
                notifications: userProfile.notifications,
                darkMode: userProfile.darkMode,
                reminderTime: userProfile.reminderTime,
                weekStartsOn: userProfile.weekStartsOn
              }
            });

          if (profileError) throw profileError;
        }

        alert('Data imported successfully! Please refresh the page to see the changes.');
        onClose();
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Invalid file format or import failed. Please select a valid backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Function to remove duplicate habits
  const removeDuplicateHabits = async () => {
    if (!user) return;

    try {
      const { data: allHabits, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const seen = new Set();
      const duplicates = [];

      for (const habit of allHabits) {
        const habitKey = habit.name.toLowerCase();
        if (seen.has(habitKey)) {
          duplicates.push(habit.id);
        } else {
          seen.add(habitKey);
        }
      }

      if (duplicates.length > 0) {
        const { error: deleteError } = await supabase
          .from('habits')
          .delete()
          .in('id', duplicates);

        if (deleteError) throw deleteError;
        
        console.log(`Removed ${duplicates.length} duplicate habits`);
        alert(`Removed ${duplicates.length} duplicate habits. Please refresh the page to see the changes.`);
      } else {
        alert('No duplicate habits found.');
      }
    } catch (error) {
      console.error('Error removing duplicates:', error);
      alert('Error removing duplicates. Please try again.');
    }
  };

  const getNotificationStatusIcon = () => {
    switch (notificationPermission) {
      case 'granted':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'denied':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <AlertCircle size={16} className="text-yellow-500" />;
    }
  };

  const getNotificationStatusText = () => {
    switch (notificationPermission) {
      case 'granted':
        return 'Notifications enabled';
      case 'denied':
        return 'Notifications blocked - enable in browser settings';
      default:
        return 'Click to enable notifications';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Settings Content */}
        <div className="p-6 space-y-6">
          
          {/* Notifications */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Notifications</h3>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-gray-500" />
                <span className="text-gray-700">Daily Reminders</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleNotificationToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Notification Status */}
            <div className="ml-6 flex items-center gap-2 text-sm">
              {getNotificationStatusIcon()}
              <span className={`${
                notificationPermission === 'granted' ? 'text-green-700' :
                notificationPermission === 'denied' ? 'text-red-700' :
                'text-yellow-700'
              }`}>
                {getNotificationStatusText()}
              </span>
            </div>

            {settings.notifications && (
              <div className="ml-6 space-y-2">
                <label className="block text-sm text-gray-600">Reminder Time</label>
                <input
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, reminderTime: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="text-xs text-gray-500">
                  {notificationPermission === 'denied' && 
                    "⚠️ Enable notifications in your browser settings to receive reminders"
                  }
                  {window.location.protocol === 'http:' && window.location.hostname === 'localhost' &&
                    "ℹ️ Notifications work best on HTTPS. Deploy your app for better reliability."
                  }
                </div>
              </div>
            )}
          </div>

          {/* Appearance */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Appearance</h3>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Moon size={18} className="text-gray-500" />
                <span className="text-gray-700">Dark Mode</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => setSettings(prev => ({ ...prev, darkMode: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm text-gray-700 mb-2">Week Starts On</label>
              <select
                value={settings.weekStartsOn}
                onChange={(e) => setSettings(prev => ({ ...prev, weekStartsOn: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="sunday">Sunday</option>
                <option value="monday">Monday</option>
              </select>
            </div>
          </div>

          {/* Data Management */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Data Management</h3>
            
            <button
              onClick={handleExportData}
              className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Download size={18} />
              <span>Export Data</span>
            </button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-full flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                <Upload size={18} />
                <span>Import Data</span>
              </div>
            </div>

            <button
              onClick={removeDuplicateHabits}
              className="w-full flex items-center gap-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <RefreshCw size={18} />
              <span>Remove Duplicates</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to reset the app? This will clear all your habits and data.')) {
                  onResetApp();
                  onClose();
                }
              }}
              className="w-full flex items-center gap-3 p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <RefreshCw size={18} />
              <span>Reset App</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                  onClearAllData();
                  onClose();
                }
              }}
              className="w-full flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 size={18} />
              <span>Clear All Data</span>
            </button>
          </div>

          {/* App Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">App Info</h3>
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <div>Version: 1.0.0</div>
              <div>Build: PWA</div>
              <div>Protocol: {window.location.protocol}</div>
              <div>Host: {window.location.hostname}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;