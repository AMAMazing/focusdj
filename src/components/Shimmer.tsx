import React from 'react';

interface ShimmerProps {
  className?: string;
}

export const Shimmer: React.FC<ShimmerProps> = ({ className = '' }) => (
  <div className={`animate-shimmer bg-gradient-to-r from-[#282828] via-[#383838] to-[#282828] bg-[length:400%_100%] ${className}`} />
);

export const VideoPlayerShimmer: React.FC = () => (
  <div className="space-y-4">
    <Shimmer className="w-full aspect-video rounded-lg" />
    <div className="flex items-center justify-between gap-4 px-2">
      <div className="flex items-center gap-2">
        {[...Array(4)].map((_, i) => (
          <Shimmer key={i} className="w-10 h-10 rounded-lg" />
        ))}
      </div>
      <Shimmer className="w-32 h-6 rounded-lg" />
    </div>
  </div>
);

export const PlaylistShimmer: React.FC = () => (
  <div className="bg-[#181818] rounded-xl overflow-hidden">
    <div className="p-4 border-b border-[#282828]">
      <Shimmer className="w-32 h-5 rounded" />
    </div>
    <div className="h-[400px] p-3 space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-3">
          <Shimmer className="w-20 h-12 rounded flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Shimmer className="w-full h-4 rounded" />
            <Shimmer className="w-16 h-3 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const PomodoroShimmer: React.FC = () => (
  <div className="flex flex-col items-center p-8 bg-[#282828] rounded-xl">
    <div className="w-full flex justify-between items-center mb-8">
      <Shimmer className="w-32 h-6 rounded" />
      <Shimmer className="w-8 h-8 rounded" />
    </div>
    <Shimmer className="w-40 h-5 rounded mb-8" />
    <Shimmer className="w-[300px] h-[300px] rounded-full mb-8" />
    <div className="w-full space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <Shimmer key={i} className="h-10 rounded-lg" />
        ))}
      </div>
      <div className="flex gap-2">
        <Shimmer className="flex-1 h-10 rounded-lg" />
        <Shimmer className="w-20 h-10 rounded-lg" />
      </div>
    </div>
  </div>
);

export const TodoShimmer: React.FC = () => (
  <div className="bg-[#282828] rounded-xl p-8">
    <Shimmer className="w-32 h-6 rounded mb-6" />
    <div className="flex gap-4 mb-6">
      <Shimmer className="flex-1 h-12 rounded-lg" />
      <Shimmer className="w-12 h-12 rounded-lg" />
    </div>
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <Shimmer key={i} className="w-full h-14 rounded-lg" />
      ))}
    </div>
  </div>
);