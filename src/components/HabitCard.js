//HabitCard.js
import React, { useState } from 'react';
import { CheckCircle2, Circle, Edit2, Save, X, Trash2 } from 'lucide-react';

const HabitCard = ({ habit, onToggle, onUpdateHabit, onDeleteHabit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(habit.name);
  const [selectedIcon, setSelectedIcon] = useState(habit.icon);
  const [selectedColor, setSelectedColor] = useState(habit.color);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fix: Use consistent date format for comparison
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const isCompleted = habit.last_completed === today || 
                     (habit.completedDates && habit.completedDates.includes(today));
  
  const completionPercentage = (habit.completions / habit.target_days) * 100;

  const handleSave = () => {
    if (editedName.trim()) {
      onUpdateHabit(habit.id, {
        name: editedName.trim(),
        icon: selectedIcon,
        color: selectedColor
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedName(habit.name);
    setSelectedIcon(habit.icon);
    setSelectedColor(habit.color);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDeleteHabit(habit.id);
    setShowDeleteConfirm(false);
  };

  const icons = ['💧', '📚', '🏃', '🧘', '🥗', '💤', '📱', '🎯', '🚭', '🥕', '🦷', '🐕'];
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500',
    'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-gray-600'
  ];

  if (isEditing) {
    return (
      <div className="bg-white rounded-3xl p-6 border-2 border-blue-200 relative">
        <div className="space-y-4">
          {/* Name Input */}
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Habit name"
            autoFocus
          />

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {icons.map(icon => (
                <button
                  key={icon}
                  onClick={() => setSelectedIcon(icon)}
                  className={`p-2 text-lg rounded-lg border-2 ${
                    selectedIcon === icon 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full ${color} ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
            >
              <Save size={16} />
              Save
            </button>
          </div>
          
          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
          >
            <Trash2 size={16} />
            Delete Habit
          </button>
        </div>
      </div>
    );
  }

  if (showDeleteConfirm) {
    return (
      <div className="bg-white rounded-3xl p-6 border-2 border-red-200 relative">
        <div className="text-center space-y-4">
          <div className="text-red-500">
            <Trash2 size={32} className="mx-auto mb-2" />
            <h3 className="font-semibold text-gray-800">Delete Habit?</h3>
            <p className="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 px-3 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${habit.color} rounded-3xl p-6 text-white relative overflow-hidden cursor-pointer group`}
      onClick={() => setIsEditing(true)}
    >
      {/* Edit indicator on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit2 size={16} className="text-white/70" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{habit.icon}</span>
        <div className="text-right">
          <div className="text-2xl font-bold">{habit.streak}</div>
          <div className="text-sm opacity-90">days</div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="font-semibold text-sm uppercase tracking-wide">
          {habit.name}
        </div>
      </div>

      {/* Fixed completion button with proper styling */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(habit.id);
        }}
        className={`absolute bottom-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
          isCompleted 
            ? 'bg-white text-green-500 shadow-lg' 
            : 'bg-white/20 text-white hover:bg-white/30 border-2 border-white/40'
        }`}
      >
        {isCompleted ? (
          <CheckCircle2 size={20} className="text-green-500" />
        ) : (
          <Circle size={20} className="text-white" />
        )}
      </button>

      {/* Progress ring */}
      <div className="absolute top-4 right-4 w-12 h-12">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeDasharray={`${completionPercentage}, 100`}
          />
        </svg>
      </div>
    </div>
  );
};

export default HabitCard;