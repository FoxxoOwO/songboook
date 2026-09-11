import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { scrapeUltimateGuitarTab, searchUltimateGuitar } from './scrapers/ultimateGuitar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 3000 : 3001);

app.use(cors());
app.use(express.json());

// Helpers
function generateMusicLinks(artist: string, title: string) {
  const query = encodeURIComponent(`${artist} ${title}`.trim());
  return {
    youtube_url: `https://www.youtube.com/results?search_query=${query}`,
    spotify_url: `https://open.spotify.com/search/${query}`,
    deezer_url: `https://www.deezer.com/search/${query}`,
  };
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'songbook-api', timestamp: new Date().toISOString() });
});

// --- Songs API ---
app.get('/api/songs', (req, res) => {
  try {
    const q = req.query.q as string | undefined;
    const tag = req.query.tag as string | undefined;
    const songs = db.getAllSongs(q, tag);
    res.json(songs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/songs/:id', (req, res) => {
  try {
    const song = db.getSongById(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Píseň nenalezena' });
    }
    res.json(song);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/songs', (req, res) => {
  try {
    const {
      title,
      artist,
      album,
      key,
      capo = 0,
      tempo = 120,
      autoscroll_speed = 20,
      content,
      tags = [],
      youtube_url,
      spotify_url,
      deezer_url,
    } = req.body;

    if (!title || !artist || !content) {
      return res.status(400).json({ error: 'Název, interpret a text s akordy jsou povinné.' });
    }

    // Auto-generate music links if not explicitly provided
    const defaultLinks = generateMusicLinks(artist, title);

    const song = db.createSong({
      title: title.trim(),
      artist: artist.trim(),
      album: album?.trim() || '',
      key: key?.trim() || '',
      capo: Number(capo) || 0,
      tempo: Number(tempo) || 120,
      autoscroll_speed: Number(autoscroll_speed) || 20,
      content,
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [],
      youtube_url: youtube_url?.trim() || defaultLinks.youtube_url,
      spotify_url: spotify_url?.trim() || defaultLinks.spotify_url,
      deezer_url: deezer_url?.trim() || defaultLinks.deezer_url,
    });

    res.status(201).json(song);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/songs/:id', (req, res) => {
  try {
    const updated = db.updateSong(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Píseň nenalezena' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/songs/:id', (req, res) => {
  try {
    const success = db.deleteSong(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Píseň nenalezena' });
    }
    res.json({ message: 'Píseň úspěšně smazána' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Playlists API ---
app.get('/api/playlists', (req, res) => {
  try {
    const playlists = db.getAllPlaylists();
    res.json(playlists);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/playlists/:id', (req, res) => {
  try {
    const playlist = db.getPlaylistById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist nenalezen' });
    }
    res.json(playlist);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/playlists', (req, res) => {
  try {
    const { title, description, song_ids } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Název playlistu je povinný.' });
    }
    const pl = db.createPlaylist(title, description, song_ids);
    res.status(201).json(pl);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/playlists/:id', (req, res) => {
  try {
    const updated = db.updatePlaylist(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Playlist nenalezen' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/playlists/:id', (req, res) => {
  try {
    const success = db.deletePlaylist(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Playlist nenalezen' });
    }
    res.json({ message: 'Playlist úspěšně smazán' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Ultimate Guitar Import & Search API ---
app.get('/api/import/ultimate-guitar/search', async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      return res.status(400).json({ error: 'Zadejte hledaný dotaz (q).' });
    }
    const results = await searchUltimateGuitar(q);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/import/ultimate-guitar', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Zadejte URL skladby z Ultimate Guitar.' });
    }
    const tab = await scrapeUltimateGuitarTab(url);
    const musicLinks = generateMusicLinks(tab.artist, tab.title);

    res.json({
      ...tab,
      youtube_url: musicLinks.youtube_url,
      spotify_url: musicLinks.spotify_url,
      deezer_url: musicLinks.deezer_url,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Static client serving (Production / Docker) ---
const clientDistCandidates = [
  process.env.CLIENT_DIST_PATH,
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), 'dist/client'),
].filter(Boolean) as string[];

const clientDistPath = clientDistCandidates.find(p => fs.existsSync(p));

if (clientDistPath) {
  console.log(`📁 Servíruji frontend z: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🎵 Songbook server běží na http://localhost:${PORT}`);
});
