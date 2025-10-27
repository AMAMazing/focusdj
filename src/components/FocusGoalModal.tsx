import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X } from 'lucide-react';

export const FocusGoalModal: React.FC = () => {
  const { isFocusGoalModalOpen, toggleFocusGoalModal, setFocusGoal, startTimer } = useStore();
  const [mainGoal, setMainGoal] = useState('');
  const [howToAchieve, setHowToAchieve] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFocusGoal({ mainGoal, howToAchieve });
    toggleFocusGoalModal(false);
    startTimer(); // Start the timer after setting the goal
  };

  if (!isFocusGoalModalOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-[#282828] rounded-xl p-8 w-full max-w-md m-4 relative">
        <button
          onClick={() => toggleFocusGoalModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Set Your Focus for this Session</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="mainGoal" className="block text-sm font-medium text-gray-300 mb-2">
              Main Goal (Optional)
            </label>
            <textarea
              id="mainGoal"
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
              placeholder="What is the one thing you want to accomplish?"
              className="w-full px-4 py-3 bg-[#383838] text-white rounded-lg border border-[#505050] focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] outline-none transition-all text-sm resize-none"
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="howToAchieve" className="block text-sm font-medium text-gray-300 mb-2">
              How will you achieve this? (Optional)
            </label>
            <textarea
              id="howToAchieve"
              value={howToAchieve}
              onChange={(e) => setHowToAchieve(e.target.value)}
              placeholder="Break it down into small, actionable steps."
              className="w-full px-4 py-3 bg-[#383838] text-white rounded-lg border border-[#505050] focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] outline-none transition-all text-sm resize-none"
              rows={5}
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-full text-base font-bold transition-all"
          >
            Start Focusing
          </button>
        </form>
      </div>
    </div>
  );
};
