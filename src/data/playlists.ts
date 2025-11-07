import { EMOJIS } from './emojis';

export interface SubPlaylist {
  name: string;
  url: string;
  yearAfter?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  icon: string;
  url?: string;
  subPlaylists?: SubPlaylist[];
}

export const newPlaylists: Playlist[] = [
  {
    id: 'lo-fi-beats',
    name: 'Lo-fi beats',
    icon: EMOJIS.NIGHT,
    description: 'Perfect for chill studying',
    url: 'https://music.youtube.com/playlist?list=OLAK5uy_lF8f3PwAOPekbLaM1jRSHIMQApVWi8A4c',
  },
  {
    id: 'hardstyle',
    name: 'Hardstyle',
    icon: EMOJIS.BOLT,
    description: 'A mix of uptempo, raw, and euphoric hardstyle.',
    subPlaylists: [
      { name: 'Uptempo Hardstyle', url: 'https://music.youtube.com/channel/UCostFi-t69RswIeX3w1EZnA' },
    ]
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
    description: 'A blend of early hardstyle and hard techno.',
    subPlaylists: [
      { name: 'Nik Sitz', url: 'https://www.youtube.com/playlist?list=OLAK5uy_lg_SSDjHhDn-ElZgeGbDYPYcadrS299Hw' },
      { name: 'Restricted', url: 'https://music.youtube.com/playlist?list=OLAK5uy_nEu3J8fFVmbPTs_2fNn1cOVua6UNVPa1s', yearAfter: 2024 },
      { name: 'TNT', url: 'https://music.youtube.com/playlist?list=OLAK5uy_l82WN-nfge7IfVkOZuQGeuDO1XwH8VzbE', yearAfter: 2021 },
      { name: 'APHØTIC', url: 'https://music.youtube.com/playlist?list=OLAK5uy_kaAguKQp20wXLkJ-3i9P9dRRcSeliLzl4' },
      { name: 'Tweekacore', url: 'https://music.youtube.com/playlist?list=OLAK5uy_lef9HMfHKqe_CW2_2Z5DgZFNYytoI5bW8' },
    ]
  },
  {
    id: 'classical',
    name: 'Classical',
    icon: EMOJIS.VIOLIN,
    description: 'Perfect for focused studying',
    url: 'https://music.youtube.com/playlist?list=OLAK5uy_m7p7tqwzdAJVSJYc8Q3l-UVpmjJjPV9zc',
  },
];
