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
    publishedAt: video.snippet.publishedAt,
  }];
};

const fetchChannelVideos = async (channelId: string, yearAfter?: number, indexLimit?: number): Promise<Video[]> => {
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

    let videoIds = data.items.map((item: any) => item.id.videoId);
    if (indexLimit) {
        videoIds = videoIds.slice(0, indexLimit);
    }
    const videoIdsString = videoIds.join(',');

    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIdsString}&key=${API_KEY}`
    );
    const detailsData = await detailsResponse.json();

    let videos = detailsData.items
      .filter((video: any) => {
          if (yearAfter) {
              const videoYear = new Date(video.snippet.publishedAt).getFullYear();
              return videoYear >= yearAfter;
          }
          return true;
      })
      .map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        duration: formatDuration(video.contentDetails.duration),
        thumbnail: `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`,
        publishedAt: video.snippet.publishedAt,
      }));

      return videos;
  } catch (error) {
    console.error('Error fetching channel videos:', error);
    throw new Error('Failed to load videos from the channel.');
  }
}

export const fetchPlaylistVideos = async (url: string, yearAfter?: number, indexLimit?: number): Promise<Video[]> => {
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
      let videos: Video[] = [];
      let nextPageToken = '';
      
      do {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`
        );
        
        if (!response.ok) {
          const error = await response.json();
          if (error.error?.code === 403) {
            throw new Error('Invalid YouTube API key');
          }
          throw new Error(error.error?.message || 'Failed to fetch playlist');
        }
        
        const data = await response.json();
        
        let items = data.items;
        if (indexLimit) {
            const remaining = indexLimit - videos.length;
            if (items.length > remaining) {
                items = items.slice(0, remaining);
            }
        }
        
        const videoIds = items
          .map((item: any) => item.snippet.resourceId.videoId)
          .join(',');

        if (!videoIds) {
            nextPageToken = data.nextPageToken;
            continue;
        }
        
        const detailsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${API_KEY}`
        );
        
        const detailsData = await detailsResponse.json();
        const videoDetails = new Map<string, { duration: string; publishedAt: string }>(
          (detailsData.items || []).map((item: any) => [
            item.id,
            {
              duration: formatDuration(item.contentDetails.duration),
              publishedAt: item.snippet.publishedAt,
            }
          ])
        );
        
        const newVideos = items
          .filter((item: any) => {
            const details = videoDetails.get(item.snippet.resourceId.videoId);
            if (!details) return false;

            const title = item.snippet.title;
            if (title === 'Private video' || title === 'Deleted video' || title === 'Unavailable video') {
              return false;
            }
            
            if (yearAfter) {
              const videoYear = new Date(details.publishedAt).getFullYear();
              if (videoYear < yearAfter) {
                return false;
              }
            }
            return true;
          })
          .map((item: any) => {
            const details = videoDetails.get(item.snippet.resourceId.videoId)!;
            return {
              id: item.snippet.resourceId.videoId,
              title: item.snippet.title,
              duration: details.duration,
              thumbnail: `https://i.ytimg.com/vi/${item.snippet.resourceId.videoId}/mqdefault.jpg`,
              publishedAt: details.publishedAt,
            };
          });
        
        videos.push(...newVideos);

        if (indexLimit && videos.length >= indexLimit) {
            break;
        }

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
      return fetchChannelVideos(channelId, yearAfter, indexLimit);
  }

  throw new Error('Invalid URL. Please provide a valid YouTube or YouTube Music URL');
};

function formatDuration(isoDuration: string): string {
  if (!isoDuration) return 'Unknown';
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 'Unknown';

  const [, hours, minutes, seconds] = match;
  const parts = [];

  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds) parts.push(`${seconds}s`);

  return parts.join(' ') || '0s';
}
