import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Lightbulb, Zap, Plus, Trash2 } from 'lucide-react';

export const BreakActivities: React.FC = () => {
  const { breakActivities, addBreakActivity, deleteBreakActivity, currentSession } = useStore();
  const [newActivity, setNewActivity] = useState({ description: '', category: 'Energizing' as 'Energizing' | 'Restorative', duration: 5 });

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newActivity.description.trim()) {
      addBreakActivity(newActivity);
      setNewActivity({ description: '', category: 'Energizing', duration: 5 });
    }
  };

  if (currentSession !== 'break') {
    return null;
  }

  const energizingActivities = breakActivities.filter(a => a.category === 'Energizing');
  const restorativeActivities = breakActivities.filter(a => a.category === 'Restorative');

  return (
    <div className="bg-[#282828] rounded-xl p-6 animate-fade-in">
      <h2 className="text-xl font-bold text-white mb-4">Break Activities</h2>

      <div className="space-y-6">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-lg text-[#1DB954] mb-3">
            <Zap size={20} />
            Energizing Menu
          </h3>
          <ul className="space-y-2">
            {energizingActivities.map(activity => (
              <li key={activity.id} className="flex justify-between items-center bg-[#1d1d1d] p-3 rounded-md">
                <span className="text-sm text-gray-300">{`[${activity.duration} MINS] ${activity.description}`}</span>
                <button onClick={() => deleteBreakActivity(activity.id)} className="text-gray-500 hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="flex items-center gap-2 font-semibold text-lg text-[#1DB954] mb-3">
            <Lightbulb size={20} />
            Restorative Menu
          </h3>
          <ul className="space-y-2">
            {restorativeActivities.map(activity => (
              <li key={activity.id} className="flex justify-between items-center bg-[#1d1d1d] p-3 rounded-md">
                <span className="text-sm text-gray-300">{`[${activity.duration} MINS] ${activity.description}`}</span>
                <button onClick={() => deleteBreakActivity(activity.id)} className="text-gray-500 hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleAddActivity} className="border-t border-[#383838] pt-4 space-y-3">
           <input
            type="text"
            value={newActivity.description}
            onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
            placeholder="Add a new break activity..."
            className="w-full px-4 py-2 bg-[#383838] text-white rounded-lg border border-[#505050] focus:border-[#1DB954] outline-none text-sm"
          />
          <div className="flex gap-2">
            <select
              value={newActivity.category}
              onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value as 'Energizing' | 'Restorative' })}
              className="px-4 py-2 bg-[#383838] text-white rounded-lg border border-[#505050] focus:border-[#1DB954] outline-none text-sm"
            >
              <option>Energizing</option>
              <option>Restorative</option>
            </select>
            <input
              type="number"
              min="1"
              value={newActivity.duration}
              onChange={(e) => setNewActivity({ ...newActivity, duration: parseInt(e.target.value) })}
              className="w-24 px-4 py-2 bg-[#383838] text-white rounded-lg border border-[#505050] focus:border-[#1DB954] outline-none text-sm"
            />
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-lg text-sm font-bold flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
