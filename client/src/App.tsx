import React, { useState, useEffect } from 'react';
import type { Song, Playlist } from './types/index.js';
import { SongList } from './components/SongList.js';
import { SongViewer } from './components/SongViewer.js';
import { SongEditor } from './components/SongEditor.js';
import { PlaylistManager } from './components/PlaylistManager.js';
import { InstrumentTuner } from './components/InstrumentTuner.js';
import { Metronome } from './components/Metronome.js';
import { StageMode } from './components/StageMode.js';
import { UltimateGuitarImportModal } from './components/UltimateGuitarImportModal.js';
import { useTheme } from './context/ThemeContext.js';
import {
  Music2,
  ListMusic,
  Disc,
  Mic,
  Plus,
  Download,
  Wifi,
  WifiOff,
  Menu,
  X,
  ChevronLeft,
  Loader2,
  Sun,
  Moon,
} from 'lucide-react';

type ViewMode = 'list' | 'view' | 'edit' | 'new' | 'playlists' | 'tuner' | 'metronome' | 'stage';

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<ViewMode>('list');
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [stageSongs, setStageSongs] = useState<Song[]>([]);
  const [stageStartIndex, setStageStartIndex] = useState<number>(0);

  const [isUGModalOpen, setIsUGModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);


  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [songsRes, plRes] = await Promise.all([
        fetch('/api/songs').catch(() => null),
        fetch('/api/playlists').catch(() => null),
      ]);

      if (songsRes && songsRes.ok) {
        const songsData = await songsRes.json();
        setSongs(songsData);
        localStorage.setItem('songbook_songs_cache', JSON.stringify(songsData));
      } else {
        const cached = localStorage.getItem('songbook_songs_cache');
        if (cached) setSongs(JSON.parse(cached));
      }

      if (plRes && plRes.ok) {
        const plData = await plRes.json();
        setPlaylists(plData);
        localStorage.setItem('songbook_playlists_cache', JSON.stringify(plData));
      } else {
        const cached = localStorage.getItem('songbook_playlists_cache');
        if (cached) setPlaylists(JSON.parse(cached));
      }
    } catch (err) {
      console.warn('Network error, checking offline cache:', err);
      const cachedSongs = localStorage.getItem('songbook_songs_cache');
      if (cachedSongs) setSongs(JSON.parse(cachedSongs));
      const cachedPl = localStorage.getItem('songbook_playlists_cache');
      if (cachedPl) setPlaylists(JSON.parse(cachedPl));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSong = async (songData: Omit<Song, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingSong?.id) {
      const res = await fetch(`/api/songs/${editingSong.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(songData),
      });
      const updated = await res.json();
      setSongs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setActiveSong(updated);
      setView('view');
    } else {
      const res = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(songData),
      });
      const created = await res.json();
      setSongs((prev) => [created, ...prev]);
      setActiveSong(created);
      setView('view');
    }
    setTimeout(loadData, 200);
  };

  const handleDeleteSong = async (songId: string) => {
    await fetch(`/api/songs/${songId}`, { method: 'DELETE' });
    setSongs((prev) => prev.filter((s) => s.id !== songId));
    if (activeSong?.id === songId) {
      setActiveSong(null);
      setView('list');
    }
    loadData();
  };

  const handleUpdateSongSpeed = async (songId: string, speed: number) => {
    try {
      await fetch(`/api/songs/${songId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoscroll_speed: speed }),
      });
      setSongs((prev) =>
        prev.map((s) => (s.id === songId ? { ...s, autoscroll_speed: speed } : s))
      );
    } catch (e) {
      console.error('Failed to update speed:', e);
    }
  };

  const handleCreatePlaylist = async (title: string, description: string) => {
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, song_ids: [] }),
    });
    const created = await res.json();
    setPlaylists((prev) => [...prev, created]);
  };

  const handleUpdatePlaylist = async (playlistId: string, updates: Partial<Playlist>) => {
    const res = await fetch(`/api/playlists/${playlistId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const updated = await res.json();
    setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    await fetch(`/api/playlists/${playlistId}`, { method: 'DELETE' });
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  };

  const handleAddSongToPlaylist = async (songId: string, playlistId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;
    if (pl.song_ids.includes(songId)) {
      alert('Tato píseň již v playlistu je.');
      return;
    }
    const newSongIds = [...pl.song_ids, songId];
    await handleUpdatePlaylist(playlistId, { song_ids: newSongIds });
    alert(`Píseň přidána do playlistu "${pl.title}".`);
  };

  const handleLaunchStageMode = (songsToPlay: Song[], startIndex = 0) => {
    setStageSongs(songsToPlay);
    setStageStartIndex(startIndex);
    setView('stage');
  };

  const handleUGImportSuccess = (imported: Partial<Song>) => {
    setEditingSong({
      id: '',
      title: imported.title || '',
      artist: imported.artist || '',
      album: imported.album || '',
      key: imported.key || 'G',
      capo: imported.capo || 0,
      tempo: 120,
      autoscroll_speed: 20,
      content: imported.content || '',
      tags: ['ultimate-guitar'],
      youtube_url: imported.youtube_url || '',
      spotify_url: imported.spotify_url || '',
      deezer_url: imported.deezer_url || '',
      created_at: '',
      updated_at: '',
    });
    setView('new');
  };

  if (view === 'stage') {
    return (
      <StageMode
        songs={stageSongs.length > 0 ? stageSongs : songs}
        initialIndex={stageStartIndex}
        onExit={() => setView('list')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100 flex flex-col transition-colors duration-150">
      {/* Top Navbar */}
      <nav className="bg-white/90 dark:bg-black/95 border-b border-zinc-200 dark:border-zinc-900 sticky top-0 z-40 backdrop-blur-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div
              onClick={() => setView('list')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-black flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Music2 className="w-4 h-4" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-zinc-900 group-hover:text-zinc-600 dark:text-white dark:group-hover:text-zinc-300 transition-colors">
                Zpěvník
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 text-sm font-semibold">
              <button
                onClick={() => setView('list')}
                className={`px-3.5 py-1.5 rounded-xl transition-colors ${
                  view === 'list' || view === 'view'
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white font-bold border border-zinc-300 dark:border-zinc-800 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900'
                }`}
              >
                Písně
              </button>

              <button
                onClick={() => setView('playlists')}
                className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
                  view === 'playlists'
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white font-bold border border-zinc-300 dark:border-zinc-800 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900'
                }`}
              >
                <ListMusic className="w-4 h-4" />
                <span>Playlisty</span>
              </button>

              <button
                onClick={() => setView('tuner')}
                className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
                  view === 'tuner'
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white font-bold border border-zinc-300 dark:border-zinc-800 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>Ladička</span>
              </button>

              <button
                onClick={() => setView('metronome')}
                className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
                  view === 'metronome'
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white font-bold border border-zinc-300 dark:border-zinc-800 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900'
                }`}
              >
                <Disc className="w-4 h-4" />
                <span>Metronom</span>
              </button>
            </div>

            {/* Right actions */}
            <div className="hidden md:flex items-center gap-2">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors"
                title={theme === 'dark' ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}
                aria-label="Přepnout motiv"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <span
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                  isOnline
                    ? 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800'
                    : 'bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800'
                }`}
                title={isOnline ? 'Připojeno k síti' : 'Offline režim (lokální data)'}
              >
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </span>

              <button
                onClick={() => setIsUGModalOpen(true)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors"
                title="Import z Ultimate Guitar"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setEditingSong(null);
                  setView('new');
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-bold rounded-xl text-xs shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Nová píseň</span>
              </button>
            </div>

            {/* Mobile menu toggle & theme toggle */}
            <div className="md:hidden flex items-center gap-1.5">
              <button
                onClick={toggleTheme}
                className="p-2 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white rounded-xl"
                title={theme === 'dark' ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-zinc-700 dark:text-zinc-400 hover:text-black dark:hover:text-white rounded-xl"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 px-4 py-3 space-y-2">
            <button
              onClick={() => {
                setView('list');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-semibold rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
            >
              Písně
            </button>
            <button
              onClick={() => {
                setView('playlists');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-semibold rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2 text-zinc-800 dark:text-zinc-200"
            >
              <ListMusic className="w-4 h-4" />
              Playlisty
            </button>
            <button
              onClick={() => {
                setView('tuner');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-semibold rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2 text-zinc-800 dark:text-zinc-200"
            >
              <Mic className="w-4 h-4" />
              Ladička
            </button>
            <button
              onClick={() => {
                setView('metronome');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-semibold rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2 text-zinc-800 dark:text-zinc-200"
            >
              <Disc className="w-4 h-4" />
              Metronom
            </button>
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-900 flex items-center gap-2">
              <button
                onClick={() => {
                  setIsUGModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 text-xs font-bold rounded-xl text-center border border-zinc-300 dark:border-zinc-800"
              >
                Import UG
              </button>
              <button
                onClick={() => {
                  setEditingSong(null);
                  setView('new');
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-xs font-bold rounded-xl text-center shadow-xs"
              >
                + Nová píseň
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {view === 'view' && (
          <div className="max-w-5xl mx-auto px-4 pt-4 no-print">
            <button
              onClick={() => setView('list')}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-black border border-zinc-200 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 rounded-xl text-xs font-semibold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Zpět na seznam písní</span>
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-zinc-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            <span className="text-sm font-medium">Načítám zpěvník...</span>
          </div>
        ) : (
          <>
            {view === 'list' && (
              <SongList
                songs={songs}
                playlists={playlists}
                onSelectSong={(song) => {
                  setActiveSong(song);
                  setView('view');
                }}
                onEditSong={(song) => {
                  setEditingSong(song);
                  setView('edit');
                }}
                onDeleteSong={handleDeleteSong}
                onCreateNewSong={() => {
                  setEditingSong(null);
                  setView('new');
                }}
                onOpenUGImport={() => setIsUGModalOpen(true)}
                onAddSongToPlaylist={handleAddSongToPlaylist}
              />
            )}

            {view === 'view' && activeSong && (
              <SongViewer
                song={activeSong}
                onEditSong={(song) => {
                  setEditingSong(song);
                  setView('edit');
                }}
                onEnterStageMode={(song) => handleLaunchStageMode([song], 0)}
                onUpdateSongSpeed={handleUpdateSongSpeed}
              />
            )}

            {(view === 'new' || view === 'edit') && (
              <SongEditor
                initialSong={editingSong || undefined}
                onSave={handleSaveSong}
                onCancel={() => setView(activeSong ? 'view' : 'list')}
              />
            )}

            {view === 'playlists' && (
              <PlaylistManager
                playlists={playlists}
                allSongs={songs}
                onCreatePlaylist={handleCreatePlaylist}
                onUpdatePlaylist={handleUpdatePlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                onSelectSong={(song) => {
                  setActiveSong(song);
                  setView('view');
                }}
                onLaunchStageMode={(songsToPlay, idx) => handleLaunchStageMode(songsToPlay, idx)}
              />
            )}

            {view === 'tuner' && <InstrumentTuner />}

            {view === 'metronome' && (
              <div className="py-12">
                <Metronome />
              </div>
            )}
          </>
        )}
      </main>

      <UltimateGuitarImportModal
        isOpen={isUGModalOpen}
        onClose={() => setIsUGModalOpen(false)}
        onImportSuccess={handleUGImportSuccess}
      />
    </div>
  );
};

export default App;
