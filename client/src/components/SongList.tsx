import React, { useState, useMemo } from 'react';
import type { Song, Playlist } from '../types/index.js';
import {
  Search,
  Plus,
  Download,
  Music2,
  Trash2,
  Edit,
  ListPlus,
  Tag as TagIcon,
  ChevronRight,
} from 'lucide-react';
import { YoutubeIcon, SpotifyIcon } from './BrandIcons.js';

interface SongListProps {
  songs: Song[];
  playlists: Playlist[];
  onSelectSong: (song: Song) => void;
  onEditSong: (song: Song) => void;
  onDeleteSong: (songId: string) => void;
  onCreateNewSong: () => void;
  onOpenUGImport: () => void;
  onAddSongToPlaylist: (songId: string, playlistId: string) => void;
}

export const SongList: React.FC<SongListProps> = ({
  songs,
  playlists,
  onSelectSong,
  onEditSong,
  onDeleteSong,
  onCreateNewSong,
  onOpenUGImport,
  onAddSongToPlaylist,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'newest'>('title');
  const [addToPlaylistSongId, setAddToPlaylistSongId] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    songs.forEach((s) => s.tags?.forEach((t) => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [songs]);

  const filteredSongs = useMemo(() => {
    let list = [...songs];

    if (selectedTag) {
      list = list.filter((s) => s.tags?.includes(selectedTag));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          (s.album && s.album.toLowerCase().includes(q)) ||
          s.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'cs');
      if (sortBy === 'artist') return a.artist.localeCompare(b.artist, 'cs');
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [songs, searchQuery, selectedTag, sortBy]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <Music2 className="w-8 h-8 text-zinc-900 dark:text-white" />
            Zpěvník skladeb
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
            Celkem <span className="font-bold text-zinc-900 dark:text-white">{songs.length}</span> písní s akordy a prstoklady
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenUGImport}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-2xs"
          >
            <Download className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>Import z Ultimate Guitar</span>
          </button>

          <button
            onClick={onCreateNewSong}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Přidat píseň</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/90 rounded-3xl p-4 md:p-5 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hledat podle názvu, autora, alba nebo štítků..."
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
              >
                Vymazat
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold hidden md:inline">Řadit:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-300 focus:outline-hidden"
            >
              <option value="title">Název (A-Z)</option>
              <option value="artist">Interpret (A-Z)</option>
              <option value="newest">Nejnovější</option>
            </select>
          </div>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-900">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedTag === null
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-bold'
                  : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Všechny ({songs.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  selectedTag === tag
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-bold'
                    : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Song Cards Grid */}
      {filteredSongs.length === 0 ? (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-12 text-center">
          <Music2 className="w-12 h-12 text-zinc-400 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Žádné písně nenalezeny</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
            Zkuste změnit vyhledávací dotaz nebo přidejte novou píseň.
          </p>
          <button
            onClick={onCreateNewSong}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-bold rounded-xl text-sm transition-all"
          >
            Přidat první píseň
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSongs.map((song) => (
            <div
              key={song.id}
              onClick={() => onSelectSong(song)}
              className="group bg-white hover:bg-zinc-50/80 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 hover:border-zinc-400 dark:border-zinc-800/90 dark:hover:border-zinc-600 rounded-3xl p-5 shadow-xs dark:shadow-xl transition-all duration-150 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-zinc-900 group-hover:text-zinc-700 dark:text-white dark:group-hover:text-zinc-200 transition-colors truncate">
                      {song.title}
                    </h3>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 truncate">
                      {song.artist}{' '}
                      {song.album && <span className="text-zinc-400 dark:text-zinc-500 text-xs font-normal">• {song.album}</span>}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 dark:text-zinc-600 dark:group-hover:text-white transition-colors shrink-0" />
                </div>

                {/* Badges: Key, Capo, BPM */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {song.key && (
                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-mono font-bold text-xs rounded-md border border-zinc-200 dark:border-zinc-800">
                      Tónina {song.key}
                    </span>
                  )}
                  {song.capo > 0 && (
                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium text-xs rounded-md border border-zinc-200 dark:border-zinc-800">
                      Capo {song.capo}
                    </span>
                  )}
                  {song.tempo && (
                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-mono text-xs rounded-md border border-zinc-200 dark:border-zinc-800">
                      {song.tempo} BPM
                    </span>
                  )}
                </div>

                {/* Tags */}
                {song.tags && song.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    {song.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] text-zinc-500 flex items-center gap-0.5"
                      >
                        <TagIcon className="w-2.5 h-2.5" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Bar Footer */}
              <div
                className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {/* External Music Links */}
                <div className="flex items-center gap-3">
                  {song.youtube_url && (
                    <a
                      href={song.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white transition-colors"
                      title="YouTube"
                    >
                      <YoutubeIcon className="w-4 h-4" />
                    </a>
                  )}
                  {song.spotify_url && (
                    <a
                      href={song.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white transition-colors"
                      title="Spotify"
                    >
                      <SpotifyIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setAddToPlaylistSongId(
                          addToPlaylistSongId === song.id ? null : song.id
                        )
                      }
                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors"
                      title="Přidat do playlistu"
                    >
                      <ListPlus className="w-4 h-4" />
                    </button>

                    {addToPlaylistSongId === song.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-2 z-30 animate-in fade-in">
                        <span className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 px-2 py-1 uppercase">
                          Vyberte playlist:
                        </span>
                        {playlists.length === 0 ? (
                          <span className="block text-xs text-zinc-400 dark:text-zinc-500 px-2 py-1">
                            Žádný playlist nevytvořen
                          </span>
                        ) : (
                          playlists.map((pl) => (
                            <button
                              key={pl.id}
                              onClick={() => {
                                onAddSongToPlaylist(song.id, pl.id);
                                setAddToPlaylistSongId(null);
                              }}
                              className="w-full text-left px-2 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-black font-medium rounded-lg transition-colors truncate"
                            >
                              {pl.title}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onEditSong(song)}
                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors"
                    title="Upravit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Opravdu chcete smazat píseň "${song.title}"?`)) {
                        onDeleteSong(song.id);
                      }
                    }}
                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors"
                    title="Smazat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
