import { EMOJIS } from './emojis';

export interface SubPlaylist {
  name: string;
  url: string;
  yearAfter?: number;
  indexLimit?: number;
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
    subPlaylists: [
    {name: 'Lo-fi Beats', url: 'https://music.youtube.com/playlist?list=OLAK5uy_ka-b2B2CGKB6VYXP2RuydJQgXc5bwvqis', indexLimit:100 }
    ]
  },
  {
    id: 'hardstyle',
    name: 'Hardstyle',
    icon: EMOJIS.BOLT,
    description: 'A mix of uptempo, raw, and euphoric hardstyle.',
    subPlaylists: [
      { name: 'Promoting Hardstyle', url: 'https://music.youtube.com/channel/UCostFi-t69RswIeX3w1EZnA' },
      { name: 'DJ Malona', url: 'https://www.youtube.com/playlist?list=PLEa3-cgxER-2qR-77E5Ncru-EkL0Kd-nM' },
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
    subPlaylists: [
      { name: 'Rova', url: 'https://music.youtube.com/playlist?list=OLAK5uy_kp_TJkd_ukO2kSwC7KZ8W9hMhnciWb3Gk' },
      { name: 'Dimension', url: 'https://www.youtube.com/playlist?list=OLAK5uy_nTjZfN8mSMGBTqAWAweeBTr4KbOUMXa8k', indexLimit: 28 },
      { name: 'Culture Shock', url: 'https://www.youtube.com/playlist?list=OLAK5uy_lFKjQg_BFYkDHqlRD-XpLDwwfIQN1JUKw', indexLimit: 21 },
      { name: '1991', url: 'https://www.youtube.com/playlist?list=OLAK5uy_kdPWsYMKLXW2XjvGQi7Rs2E4eX3MOYlTQ', indexLimit: 13 },
    ]
  },
  {
    id: 'hard-techno',
    name: 'Hard Techno',
    icon: EMOJIS.RADIOACTIVE,
    description: 'A blend of early hardstyle and hard techno.',
    subPlaylists: [
      { name: 'Nik Sitz', url: 'https://www.youtube.com/playlist?list=OLAK5uy_lg_SSDjHhDn-ElZgeGbDYPYcadrS299Hw' },
      { name: 'Restricted', url: 'https://music.youtube.com/playlist?list=OLAK5uy_nEu3J8fFVmbPTs_2fNn1cOVua6UNVPa1s', yearAfter: 2024 },
      { name: 'TNT', url: 'https://music.youtube.com/playlist?list=OLAK5uy_mTwKrWRDz-oyl02lLmLBVHQYagG5ypFFI', yearAfter: 2021, indexLimit: 34 },
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
