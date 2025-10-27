import { Video } from '../types';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY?.trim();

const extractVideoId = (url: string): string => {
  if (!url) {
    throw new Error('Please provide a YouTube URL');
  }

  const videoRegex = /(?:(?:youtube\.com|music\.youtube\.com)\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?\/]+)/;
  const match = url.match(videoRegex);
  
  if (match) {
    return match[1];
  }
  
  return '';
};

const extractPlaylistId = (url: string): string => {
  if (!url) {
    throw new Error('Please provide a YouTube URL');
  }

  const playlistRegex = /[?&]list=([^&]+)/;
  const match = url.match(playlistRegex);
  
  if (match) {
    return match[1];
  }
  
  return '';
};

const extractChannelId = (url: string): string => {
  if (!url) {
    return '';
  }

  const channelRegex = /(?:(?:youtube\.com|music\.youtube\.com)\/(?:channel\/|c\/|@))([^\/]+)/;
  const match = url.match(channelRegex);

  if (match) {
    return match[1];
  }

  return '';
}

const fetchVideoDetails = async (videoId: string): Promise<Video[]> => {
  if (!API_KEY) {
    throw new Error('YouTube API key is not configured');
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${API_KEY}`
  );

  if (!response.ok) {
    const error = await response.json();
    if (error.error?.code === 403) {
      throw new Error('Invalid YouTube API key');
    }
    throw new Error(error.error?.message || 'Failed to fetch video');
  }

  const data = await response.json();
  
  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found');
  }

  const video = data.items[0];
  return [{
    id: video.id,
    title: video.snippet.title,
    duration: formatDuration(video.contentDetails.duration),
    thumbnail: `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`,
  }];
};

const fetchChannelVideos = async (channelId: string): Promise<Video[]> => {
    if (!API_KEY) {
    throw new Error('YouTube API key is not configured');
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50&order=date&type=video&key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch channel videos');
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('No videos found for this channel');
    }

    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${API_KEY}`
    );
    const detailsData = await detailsResponse.json();

    return detailsData.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      duration: formatDuration(video.contentDetails.duration),
      thumbnail: `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`,
    }));
  } catch (error) {
    console.error('Error fetching channel videos:', error);
    throw new Error('Failed to load videos from the channel.');
  }
}

export const fetchPlaylistVideos = async (url: string): Promise<Video[]> => {
  if (!API_KEY) {
    throw new Error('YouTube API key is not configured');
  }

  const videoId = extractVideoId(url);
  if (videoId && !url.includes('list=')) {
    return fetchVideoDetails(videoId);
  }

  const playlistId = extractPlaylistId(url);
  if (playlistId) {
    try {
      const videos: Video[] = [];
      let nextPageToken = '';
      
      do {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`
        );
        
        if (!response.ok) {
          const error = await response.json();
          if (error.error?.code === 403) {
            throw new Error('Invalid YouTube API key');
          }
          throw new Error(error.error?.message || 'Failed to fetch playlist');
        }
        
        const data = await response.json();
        
        const videoIds = data.items
          .map((item: any) => item.snippet.resourceId.videoId)
          .join(',');
        
        const durationResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`
        );
        
        const durationData = await durationResponse.json();
        const durations = new Map(
          durationData.items.map((item: any) => [
            item.id,
            formatDuration(item.contentDetails.duration),
          ])
        );
        
        const newVideos = data.items
          .filter((item: any) => 
            item.snippet.title !== 'Private video' && 
            item.snippet.title !== 'Deleted video'
          )
          .map((item: any) => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            duration: durations.get(item.snippet.resourceId.videoId) || 'Unknown',
            thumbnail: `https://i.ytimg.com/vi/${item.snippet.resourceId.videoId}/mqdefault.jpg`,
          }));
        
        videos.push(...newVideos);
        nextPageToken = data.nextPageToken;
      } while (nextPageToken);
      
      return videos;
    } catch (error) {
      console.error('Error fetching content:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to load content');
    }
  }
  
  const channelId = extractChannelId(url);
  if (channelId) {
      return fetchChannelVideos(channelId);
  }

  throw new Error('Invalid URL. Please provide a valid YouTube or YouTube Music URL');
};

function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 'Unknown';

  const [, hours, minutes, seconds] = match;
  const parts = [];

  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds) parts.push(`${seconds}s`);

  return parts.join(' ') || '0s';
}
