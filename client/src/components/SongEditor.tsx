import React, { useState, useRef } from 'react';
import type { Song } from '../types/index.js';
import { convertTwoLineToChordPro, parseSongContent } from '../utils/chordParser.js';
import { ChordTooltip } from './ChordTooltip.js';
import { Save, X, Eye, Code, Wand2, Plus, Sparkles } from 'lucide-react';

interface SongEditorProps {
  initialSong?: Partial<Song>;
  onSave: (songData: Omit<Song, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

const COMMON_CHORDS = ['C', 'G', 'Am', 'F', 'Em', 'D', 'A', 'Dm', 'E7', 'H7', 'Cadd9'];

export const SongEditor: React.FC<SongEditorProps> = ({
  initialSong,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(initialSong?.title || '');
  const [artist, setArtist] = useState(initialSong?.artist || '');
  const [album, setAlbum] = useState(initialSong?.album || '');
  const [key, setKey] = useState(initialSong?.key || 'G');
  const [capo, setCapo] = useState<number>(initialSong?.capo || 0);
  const [tempo, setTempo] = useState<number>(initialSong?.tempo || 120);
  const [autoscrollSpeed, setAutoscrollSpeed] = useState<number>(initialSong?.autoscroll_speed || 20);
  const [content, setContent] = useState(initialSong?.content || '');
  const [tags, setTags] = useState<string[]>(initialSong?.tags || ['akustika']);
  const [tagInput, setTagInput] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState(initialSong?.youtube_url || '');
  const [spotifyUrl, setSpotifyUrl] = useState(initialSong?.spotify_url || '');
  const [deezerUrl, setDeezerUrl] = useState(initialSong?.deezer_url || '');

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleInsertChord = (chord: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const inserted = `[${chord}]`;
    const newContent = text.substring(0, start) + inserted + text.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + inserted.length, start + inserted.length);
    }, 0);
  };

  const handleConvertTwoLine = () => {
    const converted = convertTwoLineToChordPro(content);
    setContent(converted);
  };

  const handleGenerateMusicLinks = () => {
    if (!artist && !title) return;
    const query = encodeURIComponent(`${artist} ${title}`.trim());
    if (!youtubeUrl) setYoutubeUrl(`https://www.youtube.com/results?search_query=${query}`);
    if (!spotifyUrl) setSpotifyUrl(`https://open.spotify.com/search/${query}`);
    if (!deezerUrl) setDeezerUrl(`https://www.deezer.com/search/${query}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim() || !content.trim()) {
      alert('Vyplňte prosím Název, Interpreta a Text písně.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        artist: artist.trim(),
        album: album.trim(),
        key: key.trim(),
        capo: Number(capo) || 0,
        tempo: Number(tempo) || 120,
        autoscroll_speed: Number(autoscrollSpeed) || 20,
        content,
        tags,
        youtube_url: youtubeUrl.trim(),
        spotify_url: spotifyUrl.trim(),
        deezer_url: deezerUrl.trim(),
      });
    } catch (err: any) {
      alert('Chyba při ukládání: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const previewLines = parseSongContent(content);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {initialSong?.id ? 'Upravit píseň' : 'Nová píseň'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 font-semibold rounded-xl text-sm border border-zinc-200 dark:border-zinc-800 transition-colors"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-bold rounded-xl text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Ukládám...' : 'Uložit'}</span>
            </button>
          </div>
        </div>

        {/* Metadata Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Název písně *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="např. Stánky"
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Interpret / Autor *
            </label>
            <input
              type="text"
              required
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="např. Brontosauři"
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Album
            </label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              placeholder="např. Na kameni kámen"
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Musical Settings */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 bg-zinc-50/80 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/80">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Tónina</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="např. G nebo Am"
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-zinc-900 dark:text-white font-bold focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Capo (pražec)</label>
            <select
              value={capo}
              onChange={(e) => setCapo(Number(e.target.value))}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-zinc-900 dark:text-white focus:outline-hidden"
            >
              <option value="0">Bez kapa (0)</option>
              {Array.from({ length: 9 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Pražec {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Tempo (BPM)</label>
            <input
              type="number"
              min="30"
              max="260"
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-zinc-900 dark:text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Autoscroll (1-60)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={autoscrollSpeed}
              onChange={(e) => setAutoscrollSpeed(Number(e.target.value))}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-zinc-900 dark:text-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* Custom Tags */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
            Vlastní štítky (Tagy)
          </label>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-full text-xs font-medium"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 max-w-sm">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="přidat tag (např. táborák, rock)"
              className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white rounded-xl transition-colors border border-zinc-200 dark:border-zinc-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Music Streaming Links */}
        <div className="mb-6 bg-zinc-50/80 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Hudební odkazy (YouTube, Spotify, Deezer)
            </span>
            <button
              type="button"
              onClick={handleGenerateMusicLinks}
              className="flex items-center gap-1 text-xs text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Automaticky vygenerovat odkazy
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">YouTube URL</label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">Spotify URL</label>
              <input
                type="url"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                placeholder="https://open.spotify.com/..."
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">Deezer URL</label>
              <input
                type="url"
                value={deezerUrl}
                onChange={(e) => setDeezerUrl(e.target.value)}
                placeholder="https://deezer.com/..."
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Content Editor & Preview Tabs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'edit'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-bold'
                    : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Text a akordy</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-bold'
                    : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Živý náhled</span>
              </button>
            </div>

            {activeTab === 'edit' && (
              <button
                type="button"
                onClick={handleConvertTwoLine}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-semibold transition-colors"
                title="Převede řádky s akordy nad slovy do formátu [Am]"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Převést akordy nad slovy</span>
              </button>
            )}
          </div>

          {activeTab === 'edit' && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2 p-2 bg-zinc-100 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold mr-1">Rychlý akord:</span>
              {COMMON_CHORDS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => handleInsertChord(ch)}
                  className="px-2 py-0.5 bg-white hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-white font-mono font-bold rounded text-xs border border-zinc-300 dark:border-zinc-700 transition-colors"
                >
                  [{ch}]
                </button>
              ))}
            </div>
          )}

          {activeTab === 'edit' ? (
            <textarea
              ref={textareaRef}
              rows={18}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Vložte text písně. Akordy můžete psát v hranatých závorkách, např. [Am]Text [C]písně, nebo klasicky na řádku nad slovy..."
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 font-song text-sm leading-relaxed text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-500 focus:outline-hidden"
            />
          ) : (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 font-song text-sm leading-relaxed min-h-[400px]">
              {previewLines.map((line, lIdx) => {
                if (line.type === 'empty') return <div key={lIdx} className="h-4" />;
                if (line.type === 'section-header') {
                  return (
                    <div key={lIdx} className="font-bold text-zinc-500 dark:text-zinc-400 mt-3 mb-1 uppercase text-xs">
                      {line.rawText}
                    </div>
                  );
                }
                return (
                  <div key={lIdx} className="flex flex-wrap items-end min-h-[2.2em] py-0.5">
                    {line.segments?.map((seg, sIdx) => (
                      <div key={sIdx} className="inline-flex flex-col items-start mr-1 mb-1">
                        {seg.chord ? (
                          <span className="mb-0.5 font-bold select-none text-[0.9em]">
                            <ChordTooltip chord={seg.chord} />
                          </span>
                        ) : (
                          <span className="h-4 mb-0.5" />
                        )}
                        <span className="text-zinc-900 dark:text-zinc-100 whitespace-pre">{seg.lyric || ' '}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
