import React, { useRef } from 'react';
import { useStore } from '../store/useStore';
import { Upload, Download } from 'lucide-react';

export const ImportExport: React.FC = () => {
  const { exportData, importData } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          importData(json);
          alert('Data imported successfully!');
        } catch (error) {
          alert('Failed to import data. Please make sure it is a valid backup file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleImportClick}
        className="flex items-center justify-center gap-2 px-3 py-2 bg-[#383838] hover:bg-[#484848] text-white rounded-lg text-xs font-medium transition-colors"
        title="Import data from a backup file"
      >
        <Upload size={14} />
        <span>Import</span>
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".json"
      />
      <button
        onClick={exportData}
        className="flex items-center justify-center gap-2 px-3 py-2 bg-[#383838] hover:bg-[#484848] text-white rounded-lg text-xs font-medium transition-colors"
        title="Export your current data to a backup file"
      >
        <Download size={14} />
        <span>Export</span>
      </button>
    </div>
  );
};
