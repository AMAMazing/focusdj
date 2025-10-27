import { EMOJIS } from './emojis';

export interface Playlist {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
}

export const newPlaylists: Playlist[] = [
  {
    id: 'lo-fi-beats',
    name: 'Lo-fi beats',
    icon: EMOJIS.NIGHT,
    description: 'Perfect for chill studying',
    url: 'https://music.youtube.com/channel/UCkXd-JReGCj32ZjQVywYUqw',
  },
  {
    id: 'hardstyle',
    name: 'Hardstyle',
    icon: EMOJIS.BOLT,
    description: 'Perfect for high energy workouts',
    url: 'https://music.youtube.com/channel/UCostFi-t69RswIeX3w1EZnA',
  },
  {
    id: 'aesthetic-beats',
    name: 'Aesthetic Beats',
    icon: EMOJIS.SUNGLASSES,
    description: 'Perfect for upbeat studying',
    url: 'https://www.youtube.com/playlist?list=PL1oyW7M3mIp8lwCAvchxWdUATSzl09rdv',
  },
  {
    id: 'drum-and-bass',
    name: 'Drum and Bass',
    icon: EMOJIS.DRUM,
    description: 'Perfect for upbeat studying',
    url: 'https://www.youtube.com/playlist?list=PLwi8dzVzBhPUzCa1klpaLQer0qMs9rY3M',
  },
  {
    id: 'hard-techno',
    name: 'Hard Techno',
    icon: EMOJIS.RADIOACTIVE,
    description: 'Perfect for loud studying',
    url: 'https://www.youtube.com/playlist?list=PLWIwHErYlmlrklTcqynBBrBd1Bkn2hpaH',
  },
  {
    id: 'classical',
    name: 'Classical',
    icon: EMOJIS.VIOLIN,
    description: 'Perfect for focused studying',
    url: 'https://music.youtube.com/playlist?list=OLAK5uy_m7p7tqwzdAJVSJYc8Q3l-UVpmjJjPV9zc',
  },
];
