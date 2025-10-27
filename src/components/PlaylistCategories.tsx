import React from 'react';
import { newPlaylists } from '../data/playlists';
import { useStore } from '../store/useStore';
import { fetchPlaylistVideos } from '../utils/youtube';
import { Loader2, X } from 'lucide-react';

interface PlaylistCategoriesProps {
  onClose: () => void;
  title: string;
}

export const PlaylistCategories: React.FC<PlaylistCategoriesProps> = ({ onClose, title }) => {
  const { setPlaylist } = useStore();
  const [loading, setLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handlePlaylistSelect = async (url: string, playlistId: string) => {
    setLoading(playlistId);
    setError(null);

    try {
      const videos = await fetchPlaylistVideos(url);
      setPlaylist({
        videos,
        currentIndex: 0,
        isPlaying: true,
        volume: 70,
        audioOnly: false,
        shuffle: true,
        repeat: false,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlist');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-[#282828] rounded-xl p-6 w-full max-w-lg m-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold text-white mb-4 text-center">{title}</h2>
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {newPlaylists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => handlePlaylistSelect(playlist.url, playlist.id)}
                disabled={!!loading}
                className="bg-[#383838] rounded-lg p-3 text-left hover:bg-[#424242] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                <span className="text-3xl">{playlist.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-white truncate">{playlist.name}</h3>
                  <p className="text-xs text-gray-400">{playlist.description}</p>
                </div>
                {loading === playlist.id && (
                  <Loader2 size={20} className="text-[#1DB954] animate-spin" />
                )}
              </button>
            ))}
          </div>
          {error && (
            <p className="mt-4 px-4 py-2 text-sm text-red-400 bg-red-400/10 rounded-lg">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};
