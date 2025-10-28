import React from 'react';
import { Github, Trash2 } from 'lucide-react';
import { ImportExport } from './ImportExport';
import { useStore } from '../store/useStore';

export const Footer: React.FC = () => {
  const { clearAllData } = useStore();

  return (
    <footer className="mt-8 py-4 px-6 border-t border-[#282828]">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <ImportExport />
          <button
            onClick={clearAllData}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
            title="Clear all data"
          >
            <Trash2 size={18} />
            <span>Clear Data</span>
          </button>
        </div>
        <div className="text-center text-xs text-gray-500">
          <p>For the best experience, please keep this tab active. Autoplay may not work in the background.</p>
        </div>
        <a
          href="https://github.com/AMAMazing"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#1DB954] transition-colors"
        >
          <Github size={18} />
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
};
