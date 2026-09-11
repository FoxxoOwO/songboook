import fs from 'fs';
import path from 'path';
import { DatabaseSchema, Song, Playlist } from './types.js';

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const INITIAL_SONGS: Song[] = [
  {
    id: 'stanky-brontosauri',
    title: 'Stánky',
    artist: 'Brontosauři / Jan Nedvěd',
    album: 'Na kameni kámen',
    key: 'G',
    capo: 0,
    tempo: 95,
    autoscroll_speed: 22,
    tags: ['táborák', 'české', 'folklór', 'klasika'],
    youtube_url: 'https://www.youtube.com/watch?v=kYJ5oQ1gN0k',
    spotify_url: 'https://open.spotify.com/track/1a2b3c',
    deezer_url: '',
    content: `{title: Stánky}
{artist: Brontosauři}

[G]U stánků [C]na levnou krásu,
[G]postávaj a [D]smějou se času,
[G]ujíždí jim [C]vlak, co právě [G]přijel, [D]a nikdo [G]neví.

[G]U stánků [C]na levnou krásu,
[G]postávaj a [D]smějou se času,
[G]ujíždí jim [C]vlak, co právě [G]přijel, [D]a nikdo [G]neví.

R:
Jen [C]zahlídli svět, maj na duši [D]vrásky,
tak [G]málo je, [Em]málo je lásky,
[G]ztracená víra hrozny z vinic [D]neoberou.

[G]Chtěli by [C]žít, jako ti druzí,
[G]v kabelkách [D]kousek mýdla a špínu,
[G]probudí tě [C]ráno a v [G]ústech zbylo [D]jenom slano.

R:
Jen [C]zahlídli svět, maj na duši [D]vrásky,
tak [G]málo je, [Em]málo je lásky,
[G]ztracená víra hrozny z vinic [D]neoberou.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'bedna-od-vodopadu',
    title: 'Bedna od vodopádu',
    artist: 'Miki Ryvola',
    album: 'Zlatý klíč',
    key: 'Am',
    capo: 0,
    tempo: 108,
    autoscroll_speed: 25,
    tags: ['táborák', 'trampské', 'české', 'akustika'],
    youtube_url: 'https://www.youtube.com/watch?v=abcxyz123',
    spotify_url: '',
    deezer_url: '',
    content: `{title: Bedna od vodopádu}
{artist: Miki Ryvola}

[Am]Tak kopni do tý [C]bedny, ať [G]panstvo neče[Am]ká,
jsou dlouhý schody do nebe a [G]štreka dale[Am]ká.
Do nebeskýho báru, čas [C]kvapí, [G]už je [Am]čas,
tak kopni do tý bedny, ať [G]chytneš druhej [Am]dech!

R:
[Am]Mít tak všechny [C]prachy, co [G]jsem do chřtánu [Am]vlil,
mít tak všechny [C]holky, co [G]jsem s nima [Am]byl!
Jenže [C]člověk míní, [G]pánbůh [Am]mění,
a z [C]velký slávy [G]zbylo [Am]vření!

[Am]Tak kopni do tý [C]bedny, ať [G]panstvo neče[Am]ká,
jsou dlouhý schody do nebe a [G]štreka dale[Am]ká!`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'wonderwall-oasis',
    title: 'Wonderwall',
    artist: 'Oasis',
    album: "(What's the Story) Morning Glory?",
    key: 'Em',
    capo: 2,
    tempo: 87,
    autoscroll_speed: 20,
    tags: ['rock', 'britpop', 'anglické', 'kytara'],
    youtube_url: 'https://www.youtube.com/watch?v=bx1Bh8ZvH84',
    spotify_url: 'https://open.spotify.com/track/7ygpRikVyFcf9pD07yZqoo',
    deezer_url: '',
    content: `{title: Wonderwall}
{artist: Oasis}
{capo: 2}

[Em7]Today is [G]gonna be the day that they're [Dsus4]gonna throw it back to [A7sus4]you
[Em7]By now you [G]should've somehow rea[Dsus4]lised what you gotta [A7sus4]do
[Em7]I don't believe that [G]anybody [Dsus4]feels the way I [A7sus4]do about you [Cadd9]now [Dsus4] [A7sus4]

[Em7]Backbeat, the [G]word is on the street that the [Dsus4]fire in your heart is [A7sus4]out
[Em7]I'm sure you've [G]heard it all before, but you [Dsus4]never really had a [A7sus4]doubt
[Em7]I don't believe that [G]anybody [Dsus4]feels the way I [A7sus4]do about you [Em7]now [G] [Dsus4] [A7sus4]

[Cadd9]And all the [D]roads we have to walk are [Em7]winding
[Cadd9]And all the [D]lights that lead us there are [Em7]blinding
[Cadd9]There are many [D]things that I would [G]like to [D/F#]say to [Em7]you,
but I don't know [A7sus4]how

Chorus:
Because [Cadd9]maybe, [Em7] [G]
you're [Em7]gonna be the one that [Cadd9]saves me [Em7] [G]
And [Em7]after [Cadd9]all, [Em7] [G]
you're my [Em7]wonder[Cadd9]wall [Em7] [G] [Em7]`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'hallelujah-leonard-cohen',
    title: 'Hallelujah',
    artist: 'Leonard Cohen',
    album: 'Various Positions',
    key: 'C',
    capo: 0,
    tempo: 60,
    autoscroll_speed: 18,
    tags: ['balada', 'anglické', 'klasika', 'akustika'],
    youtube_url: 'https://www.youtube.com/watch?v=ttEMYvpoR-k',
    spotify_url: '',
    deezer_url: '',
    content: `{title: Hallelujah}
{artist: Leonard Cohen}

Now I've [C]heard there was a [Am]secret chord
That [C]David played, and it [Am]pleased the Lord
But [F]you don't really [G]care for music, [C]do you? [G]
It [C]goes like this, the [F]fourth, the [G]fifth
The [Am]minor fall, the [F]major lift
The [G]baffled king com[E7]posing Halle[Am]lujah

Chorus:
Halle[F]lujah, Halle[Am]lujah
Halle[F]lujah, Halle[C]lu---[G]--[C]jah [G]

Your [C]faith was strong but you [Am]needed proof
You [C]saw her bathing [Am]on the roof
Her [F]beauty and the [G]moonlight over[C]threw you [G]
She [C]tied you to a [F]kitchen [G]chair
She [Am]broke your throne, and she [F]cut your hair
And [G]from your lips she [E7]drew the Halle[Am]lujah

Chorus:
Halle[F]lujah, Halle[Am]lujah
Halle[F]lujah, Halle[C]lu---[G]--[C]jah`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'taborak-playlist',
    title: '🔥 K táboráku a na chatu',
    description: 'Nejlepší pecky k ohni na kytaru, co všichni znají zpaměti.',
    song_ids: ['stanky-brontosauri', 'bedna-od-vodopadu'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'akustika-world',
    title: '🎸 Světová akustika',
    description: 'Oblíbené mezinárodní akustické hity.',
    song_ids: ['wonderwall-oasis', 'hallelujah-leonard-cohen'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err: any) {
        console.error(`⚠️ Nelze vytvořit složku ${DATA_DIR}:`, err.message);
      }
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading db.json, creating initial data:', err);
        this.data = { songs: INITIAL_SONGS, playlists: INITIAL_PLAYLISTS };
        this.save();
      }
    } else {
      const seedCandidates = [
        path.resolve(process.cwd(), 'data-default/db.json'),
        path.resolve(process.cwd(), 'server/data/db.json'),
        path.resolve(process.cwd(), 'data/db.json'),
      ];
      const seedPath = seedCandidates.find(p => p !== DB_FILE && fs.existsSync(p));
      if (seedPath) {
        try {
          const raw = fs.readFileSync(seedPath, 'utf-8');
          this.data = JSON.parse(raw);
        } catch {
          this.data = { songs: INITIAL_SONGS, playlists: INITIAL_PLAYLISTS };
        }
      } else {
        this.data = { songs: INITIAL_SONGS, playlists: INITIAL_PLAYLISTS };
      }
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err: any) {
      console.error(`❌ Chyba při ukládání do ${DB_FILE}:`, err.message);
    }
  }

  // Songs
  getAllSongs(query?: string, tag?: string): Song[] {
    let result = [...this.data.songs];
    if (tag) {
      const lowerTag = tag.toLowerCase().trim();
      result = result.filter(s => s.tags?.some(t => t.toLowerCase() === lowerTag));
    }
    if (query) {
      const q = query.toLowerCase().trim();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.album && s.album.toLowerCase().includes(q)) ||
        s.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }

  getSongById(id: string): Song | undefined {
    return this.data.songs.find(s => s.id === id);
  }

  createSong(songData: Omit<Song, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Song {
    if (songData.id) {
      const existing = this.data.songs.find(s => s.id === songData.id);
      if (existing) {
        return this.updateSong(songData.id, songData)!;
      }
    }
    const id = songData.id || (songData.title.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4));
    const now = new Date().toISOString();
    const newSong: Song = {
      ...songData,
      id,
      created_at: now,
      updated_at: now,
    };
    this.data.songs.unshift(newSong);
    this.save();
    return newSong;
  }

  updateSong(id: string, updates: Partial<Song>): Song | null {
    const idx = this.data.songs.findIndex(s => s.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.data.songs[idx] = {
      ...this.data.songs[idx],
      ...updates,
      id, // protect id
      updated_at: now,
    };
    this.save();
    return this.data.songs[idx];
  }

  deleteSong(id: string): boolean {
    const initialLen = this.data.songs.length;
    this.data.songs = this.data.songs.filter(s => s.id !== id);
    if (this.data.songs.length !== initialLen) {
      // also remove from playlists
      this.data.playlists.forEach(p => {
        p.song_ids = p.song_ids.filter(sid => sid !== id);
      });
      this.save();
      return true;
    }
    return false;
  }

  // Playlists
  getAllPlaylists(): Playlist[] {
    return this.data.playlists;
  }

  getPlaylistById(id: string): (Playlist & { songs: Song[] }) | null {
    const playlist = this.data.playlists.find(p => p.id === id);
    if (!playlist) return null;
    const songs = playlist.song_ids
      .map(sid => this.data.songs.find(s => s.id === sid))
      .filter((s): s is Song => Boolean(s));
    return { ...playlist, songs };
  }

  createPlaylist(title: string, description?: string, song_ids: string[] = [], customId?: string): Playlist {
    if (customId) {
      const existing = this.data.playlists.find(p => p.id === customId);
      if (existing) {
        return this.updatePlaylist(customId, { title, description: description || '', song_ids })!;
      }
    }
    const id = customId || ('pl-' + Date.now());
    const now = new Date().toISOString();
    const newPlaylist: Playlist = {
      id,
      title,
      description: description || '',
      song_ids,
      created_at: now,
      updated_at: now,
    };
    this.data.playlists.push(newPlaylist);
    this.save();
    return newPlaylist;
  }

  updatePlaylist(id: string, updates: Partial<Playlist>): Playlist | null {
    const idx = this.data.playlists.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.data.playlists[idx] = {
      ...this.data.playlists[idx],
      ...updates,
      id,
      updated_at: now,
    };
    this.save();
    return this.data.playlists[idx];
  }

  deletePlaylist(id: string): boolean {
    const initialLen = this.data.playlists.length;
    this.data.playlists = this.data.playlists.filter(p => p.id !== id);
    if (this.data.playlists.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
}

export const db = new Database();
