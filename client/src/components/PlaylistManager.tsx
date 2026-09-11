import React, { useState } from 'react';
import type { Playlist, Song } from '../types/index.js';
import {
  ListMusic,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Maximize2,
  X,
  Play,
} from 'lucide-react';

interface PlaylistManagerProps {
  playlists: Playlist[];
  allSongs: Song[];
  onCreatePlaylist: (title: string, description: string) => Promise<void>;
  onUpdatePlaylist: (playlistId: string, updates: Partial<Playlist>) => Promise<void>;
  onDeletePlaylist: (playlistId: string) => Promise<void>;
  onSelectSong: (song: Song) => void;
  onLaunchStageMode: (songs: Song[], startIndex?: number) => void;
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlists,
  allSongs,
  onCreatePlaylist,
  onUpdatePlaylist,
  onDeletePlaylist,
  onSelectSong,
  onLaunchStageMode,
}) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    playlists[0]?.id || null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  const activeSongs = (activePlaylist?.song_ids || [])
    .map((id) => allSongs.find((s) => s.id === id))
    .filter((s): s is Song => Boolean(s));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onCreatePlaylist(newTitle.trim(), newDescription.trim());
    setNewTitle('');
    setNewDescription('');
    setIsCreating(false);
  };

  const handleMoveSong = async (index: number, direction: 'up' | 'down') => {
    if (!activePlaylist) return;
    const newSongIds = [...activePlaylist.song_ids];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSongIds.length) return;

    const [moved] = newSongIds.splice(index, 1);
    newSongIds.splice(targetIndex, 0, moved);

    await onUpdatePlaylist(activePlaylist.id, { song_ids: newSongIds });
  };

  const handleRemoveSong = async (songId: string) => {
    if (!activePlaylist) return;
    const newSongIds = activePlaylist.song_ids.filter((id) => id !== songId);
    await onUpdatePlaylist(activePlaylist.id, { song_ids: newSongIds });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <ListMusic className="w-8 h-8 text-zinc-900 dark:text-white" />
            Playlisty & Setlisty
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
            Uspořádejte si skladby na vystoupení, k táboráku nebo na zkoušku kapely
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-bold rounded-xl text-sm transition-all active:scale-95 shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nový playlist</span>
        </button>
      </div>

      {isCreating && (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-3xl p-6 shadow-xl mb-8 animate-in fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Vytvořit nový playlist</h3>
            <button
              onClick={() => setIsCreating(false)}
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                Název playlistu *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="např. Páteční koncert nebo Táborák 2026"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">Popis</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Krátký popis nebo poznámka..."
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-500 focus:outline-hidden"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-800"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black rounded-xl text-sm font-bold shadow-md"
              >
                Vytvořit
              </button>
            </div>
          </form>
        </div>
      )}

      {playlists.length === 0 ? (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center">
          <ListMusic className="w-12 h-12 text-zinc-400 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Zatím žádné playlisty</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Vytvořte si svůj první playlist pro rychlé řazení písní.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-bold rounded-xl text-sm"
          >
            Vytvořit playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2.5">
            <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-1 mb-2">
              Vaše playlisty ({playlists.length})
            </span>

            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => setSelectedPlaylistId(pl.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedPlaylistId === pl.id
                    ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 shadow-xs text-zinc-900 dark:text-white'
                    : 'bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <h4 className="font-bold text-base text-zinc-900 dark:text-white truncate">{pl.title}</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {pl.description || `${pl.song_ids?.length || 0} skladeb`}
                  </p>
                </div>
                <span className="shrink-0 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700">
                  {pl.song_ids?.length || 0}
                </span>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            {activePlaylist && (
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs dark:shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-5">
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{activePlaylist.title}</h2>
                    {activePlaylist.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{activePlaylist.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {activeSongs.length > 0 && (
                      <button
                        onClick={() => onLaunchStageMode(activeSongs)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-bold rounded-xl text-xs shadow-xs transition-all active:scale-95"
                        title="Spustit celý playlist v celoobrazovkovém režimu na pódium"
                      >
                        <Maximize2 className="w-4 h-4" />
                        <span>Spustit Stage Mode</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`Opravdu chcete smazat playlist "${activePlaylist.title}"?`)) {
                          onDeletePlaylist(activePlaylist.id);
                        }
                      }}
                      className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-xl transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
                      title="Smazat playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {activeSongs.length === 0 ? (
                  <div className="text-center py-10 text-zinc-400 dark:text-zinc-500">
                    <p className="text-sm">V tomto playlistu zatím nejsou žádné písně.</p>
                    <p className="text-xs mt-1 text-zinc-500 dark:text-zinc-600">
                      Přejděte do seznamu písní a klikněte na ikonu + u písně pro její přidání.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeSongs.map((song, index) => (
                      <div
                        key={song.id + index}
                        className="flex items-center justify-between p-3.5 bg-zinc-50 hover:bg-zinc-100/80 dark:bg-zinc-900/60 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          <span className="w-6 text-center font-mono font-bold text-zinc-400 dark:text-zinc-500 text-xs">
                            {index + 1}.
                          </span>
                          <div className="min-w-0 cursor-pointer" onClick={() => onSelectSong(song)}>
                            <p className="font-bold text-zinc-900 group-hover:text-zinc-700 dark:text-white dark:group-hover:text-zinc-200 text-sm transition-colors truncate">
                              {song.title}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{song.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onSelectSong(song)}
                            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg transition-colors"
                            title="Otevřít píseň"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleMoveSong(index, 'up')}
                            disabled={index === 0}
                            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg disabled:opacity-30 transition-colors"
                            title="Posunout nahoru"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleMoveSong(index, 'down')}
                            disabled={index === activeSongs.length - 1}
                            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg disabled:opacity-30 transition-colors"
                            title="Posunout dolů"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleRemoveSong(song.id)}
                            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg transition-colors"
                            title="Odebrat z playlistu"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

