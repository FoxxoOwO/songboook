export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  key?: string;
  capo: number;
  tempo?: number; // BPM
  autoscroll_speed: number;
  content: string; // ChordPro format or chord lines
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
  songs?: Song[];
}

export type InstrumentType = 'guitar' | 'ukulele';

export type NotationSystem = 'european' | 'international'; // European uses H instead of B

export interface ChordDefinition {
  name: string;
  instrument: InstrumentType;
  frets: number[]; // frets for each string (-1 for muted/x, 0 for open, 1+ for fret)
  fingers?: number[]; // finger numbers (1: index, 2: middle, 3: ring, 4: pinky, 0: none)
  barre?: {
    fret: number;
    fromString: number;
    toString: number;
  };
  baseFret?: number; // Starting fret on diagram if higher than 1
}

export interface PitchTarget {
  name: string;
  freq: number;
  stringIndex?: number;
}

export interface TuningPreset {
  id: string;
  name: string;
  instrument: InstrumentType;
  strings: PitchTarget[];
}
