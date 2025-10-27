import React from 'react';
import { Github } from 'lucide-react';
import { ImportExport } from './ImportExport';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-8 py-4 px-6 border-t border-[#282828]">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <ImportExport />
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
