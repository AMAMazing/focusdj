import React, { memo, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ChevronDown, ChevronUp } from 'lucide-react';

const PlaylistSidebar: React.FC = () => {
  const { playlist, setCurrentVideo, isRunning } = useStore();
  const { videos, currentIndex } = playlist;
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    if (isRunning) {
      setIsCollapsed(true);
    }
  }, [isRunning]);

  if (videos.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#181818] rounded-xl overflow-hidden transition-all duration-300">
      <div 
        className="p-3 border-b border-[#282828] flex justify-between items-center cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="font-medium text-sm text-gray-400">
          {`Playlist • ${videos.length} videos`}
        </h3>
        <button className="text-gray-400 hover:text-white">
          {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="h-[400px] overflow-y-auto custom-scrollbar animate-fade-in">
          {videos.map((video, index) => (
            <button
              key={video.id}
              onClick={() => setCurrentVideo(index)}
              className={`w-full p-3 flex items-start gap-3 hover:bg-[#282828]/50 transition-colors ${
                currentIndex === index ? 'bg-[#282828]' : ''
              }`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
                  alt=""
                  className="w-20 h-12 object-cover rounded"
                  loading="lazy"
                />
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-white line-clamp-2 mb-1">
                  {video.title}
                </p>
                <p className="text-[10px] text-gray-400">
                  {video.duration}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(PlaylistSidebar);
