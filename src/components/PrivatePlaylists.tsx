import React, { useEffect, useState } from 'react';
import { gapi } from 'gapi-script';
import { useStore } from '../store/useStore';
import { fetchPlaylistVideos } from '../utils/youtube';
import { Loader2 } from 'lucide-react';

interface Playlist {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
  };
}

export const PrivatePlaylists: React.FC = () => {
  const { setPlaylist, isLoggedIn } = useStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      gapi.client.youtube.playlists.list({
        part: ['snippet'],
        mine: true,
        maxResults: 50,
      })
      .then((response: any) => {
        setPlaylists(response.result.items);
        setLoading(false);
      })
      .catch((err: any) => {
        setError("Error fetching playlists: " + err.message);
        setLoading(false);
      });
    }
  }, [isLoggedIn]);

  const handlePlaylistSelect = async (playlistId: string) => {
    setLoading(true);
    setError(null);

    try {
      const videos = await fetchPlaylistVideos(`https://www.youtube.com/playlist?list=${playlistId}`);
      setPlaylist({
        videos,
        currentIndex: 0,
        isPlaying: true,
        volume: 70,
        audioOnly: false,
        shuffle: true,
        repeat: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  if (loading) {
    return <div className="flex justify-center items-center p-4"><Loader2 className="animate-spin" /></div>;
  }

  if (error) {
    return <p className="text-red-400 text-xs p-4">{error}</p>;
  }

  return (
    <div className="bg-[#1d1d1d] rounded-xl p-4 animate-fade-in mt-4">
      <h3 className="font-semibold text-white mb-4">Your Playlists</h3>
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => handlePlaylistSelect(playlist.id)}
              className="bg-[#282828] rounded-lg p-3 text-left hover:bg-[#323232] transition-all flex items-center gap-3"
            >
              <img src={playlist.snippet.thumbnails.medium.url} alt={playlist.snippet.title} className="w-16 h-16 object-cover rounded" />
              <div className="flex-1">
                <h4 className="font-semibold text-white truncate text-sm">{playlist.snippet.title}</h4>
                <p className="text-xs text-gray-400 line-clamp-2">{playlist.snippet.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
