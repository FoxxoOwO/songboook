export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  key?: string;
  capo: number;
  tempo?: number; // BPM
  autoscroll_speed: number; // 1 - 100
  content: string; // ChordPro format [Am] text or chord lines
  tags: string[];
  youtube_url?: string;
  spotify_url?: string;
  deezer_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  song_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface DatabaseSchema {
  songs: Song[];
  playlists: Playlist[];
}
