//AddHabitModal.js
import React, { useState } from 'react';
import { X } from 'lucide-react';

const AddHabitModal = ({ isOpen, onClose, onAddHabit }) => {
  const [newHabit, setNewHabit] = useState({
    name: '',
    icon: '✅',
    color: 'bg-green-500',
    category: 'general'
  });

  const handleAddHabit = () => {
    if (newHabit.name.trim()) {
      const habit = {
        name: newHabit.name,
        icon: newHabit.icon,
        color: newHabit.color,
        category: newHabit.category,
        targetDays: 30 // This will be used as target_days in App.js
      };
      
      onAddHabit(habit);
      setNewHabit({ name: '', icon: '✅', color: 'bg-green-500', category: 'general' });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Add New Habit</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Habit Name
            </label>
            <input
              type="text"
              value={newHabit.name}
              onChange={(e) => setNewHabit(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Drink 8 glasses of water"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {['💧', '📚', '🏃', '🧘', '🥗', '💤', '📱', '🎯', '🚭', '🥕', '🦷', '🐕'].map(icon => (
                <button
                  key={icon}
                  onClick={() => setNewHabit(prev => ({ ...prev, icon }))}
                  className={`p-2 text-xl rounded-lg border-2 ${
                    newHabit.icon === icon 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                'bg-red-500',
                'bg-orange-500', 
                'bg-yellow-500',
                'bg-green-500',
                'bg-blue-500',
                'bg-purple-500',
                'bg-pink-500',
                'bg-gray-600'
              ].map(color => (
                <button
                  key={color}
                  onClick={() => setNewHabit(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full ${color} ${
                    newHabit.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddHabit}
            className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Habit
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddHabitModal;