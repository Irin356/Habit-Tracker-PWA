import React, { useState } from 'react';
import { User, Camera, Edit2, Save, X, Mail, Calendar, Target, Award } from 'lucide-react';

const Profile = ({ userProfile, onUpdateProfile, stats }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(userProfile);
  const [imagePreview, setImagePreview] = useState(userProfile.profilePicture || null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setEditedProfile(prev => ({ ...prev, profilePicture: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onUpdateProfile(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(userProfile);
    setImagePreview(userProfile.profilePicture || null);
    setIsEditing(false);
  };

  const formatJoinDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
  <div className="space-y-6">
    {/* Profile Header with Gradient Background */}
    <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-1 shadow-lg">
      <div className="bg-white rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Profile</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit2 size={18} />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
              <button
                onClick={handleSave}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Save size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Profile Picture Section with Gradient Border */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="p-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User size={32} className="text-gray-400" />
                )}
              </div>
            </div>
            
            {isEditing && (
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center cursor-pointer hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg">
                <Camera size={16} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Profile Information with Colored Backgrounds */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile.name}
                onChange={(e) => setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            ) : (
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <User size={16} className="text-blue-600" />
                <span className="text-gray-800">{userProfile.name || 'Not set'}</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={editedProfile.email}
                onChange={(e) => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            ) : (
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100">
                <Mail size={16} className="text-green-600" />
                <span className="text-gray-800">{userProfile.email || 'Not set'}</span>
              </div>
            )}
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Goal
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile.goal}
                onChange={(e) => setEditedProfile(prev => ({ ...prev, goal: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What's your daily goal?"
              />
            ) : (
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg border border-orange-100">
                <Target size={16} className="text-orange-600" />
                <span className="text-gray-800">{userProfile.goal || 'Not set'}</span>
              </div>
            )}
          </div>

          {/* Join Date (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member Since
            </label>
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
              <Calendar size={16} className="text-purple-600" />
              <span className="text-gray-800">{formatJoinDate(userProfile.joinDate)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Stats Overview with Enhanced Colors */}
    <div className="bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 rounded-2xl p-1 shadow-lg">
      <div className="bg-white rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Progress</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Best Streak</span>
            </div>
            <div className="text-2xl font-bold text-blue-800">{stats.bestStreak}</div>
            <div className="text-sm text-blue-600">days</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Completion</span>
            </div>
            <div className="text-2xl font-bold text-green-800">{stats.completionRate}%</div>
            <div className="text-sm text-green-600">all time</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Total Days</span>
            </div>
            <div className="text-2xl font-bold text-purple-800">{stats.totalCompletions}</div>
            <div className="text-sm text-purple-600">completed</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Active Since</span>
            </div>
            <div className="text-lg font-bold text-orange-800">
              {Math.ceil((new Date() - new Date(userProfile.joinDate)) / (1000 * 60 * 60 * 24))}
            </div>
            <div className="text-sm text-orange-600">days</div>
          </div>
        </div>
      </div>
    </div>

    {/* App Settings with Gradient */}
    <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-1 shadow-lg">
      <div className="bg-white rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Preferences</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
            <span className="text-gray-700">Daily Reminders</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={userProfile.notifications}
                onChange={(e) => {
                  if (isEditing) {
                    setEditedProfile(prev => ({ ...prev, notifications: e.target.checked }));
                  } else {
                    onUpdateProfile({ ...userProfile, notifications: e.target.checked });
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
            <span className="text-gray-700">Dark Mode</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={userProfile.darkMode}
                onChange={(e) => {
                  if (isEditing) {
                    setEditedProfile(prev => ({ ...prev, darkMode: e.target.checked }));
                  } else {
                    onUpdateProfile({ ...userProfile, darkMode: e.target.checked });
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default Profile;