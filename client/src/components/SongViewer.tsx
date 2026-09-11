import React, { useState, useEffect, useRef } from 'react';
import type { Song, InstrumentType, NotationSystem } from '../types/index.js';
import { parseSongContent } from '../utils/chordParser.js';
import { transposeChord } from '../utils/transposer.js';
import { ChordTooltip } from './ChordTooltip.js';
import { AutoscrollToolbar } from './AutoscrollToolbar.js';
import { YoutubeIcon, SpotifyIcon, DeezerIcon } from './BrandIcons.js';
import {
  Maximize2,
  Printer,
  Columns,
  Square,
  Hash,
  ExternalLink,
  Edit,
  Tag as TagIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SongViewerProps {
  song: Song;
  onEditSong: (song: Song) => void;
  onEnterStageMode: (song: Song) => void;
  onUpdateSongSpeed: (songId: string, speed: number) => void;
}

export const SongViewer: React.FC<SongViewerProps> = ({
  song,
  onEditSong,
  onEnterStageMode,
  onUpdateSongSpeed,
}) => {
  const [transposeSemitones, setTransposeSemitones] = useState<number>(0);
  const [preferFlats, setPreferFlats] = useState<boolean>(false);
  const [capoFret, setCapoFret] = useState<number>(song.capo || 0);
  const [notation] = useState<NotationSystem>('international');
  const [instrument, setInstrument] = useState<InstrumentType>('guitar');
  const [leftHanded, setLeftHanded] = useState<boolean>(false);

  const [twoColumns, setTwoColumns] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(16);
  const [showYoutubeEmbed, setShowYoutubeEmbed] = useState<boolean>(false);

  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(song.autoscroll_speed || 20);
  const scrollAnimRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number>(0);

  useEffect(() => {
    setScrollSpeed(song.autoscroll_speed || 20);
    setCapoFret(song.capo || 0);
    setTransposeSemitones(0);
    setIsScrolling(false);
  }, [song]);

  useEffect(() => {
    if (!isScrolling) {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
      return;
    }

    const step = (timestamp: number) => {
      if (!lastScrollTimeRef.current) lastScrollTimeRef.current = timestamp;
      const deltaTime = (timestamp - lastScrollTimeRef.current) / 1000;
      lastScrollTimeRef.current = timestamp;

      const pxPerSec = scrollSpeed * 1.6;
      window.scrollBy(0, pxPerSec * deltaTime);

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5) {
        setIsScrolling(false);
        return;
      }

      scrollAnimRef.current = requestAnimationFrame(step);
    };

    lastScrollTimeRef.current = performance.now();
    scrollAnimRef.current = requestAnimationFrame(step);

    return () => {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    };
  }, [isScrolling, scrollSpeed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        setIsScrolling((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSpeedChange = (newSpeed: number) => {
    setScrollSpeed(newSpeed);
    onUpdateSongSpeed(song.id, newSpeed);
  };

  const handleResetToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getYoutubeVideoId = (url?: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };
  const youtubeVideoId = getYoutubeVideoId(song.youtube_url);

  const parsedLines = parseSongContent(song.content);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/90 rounded-3xl p-5 md:p-7 shadow-xs dark:shadow-2xl mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/90 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                {song.title}
              </h1>
              <button
                onClick={() => onEditSong(song)}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-colors no-print"
                title="Upravit píseň"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <p className="text-base md:text-lg font-medium text-zinc-600 dark:text-zinc-400 mt-1">
              {song.artist} {song.album && <span className="text-zinc-400 dark:text-zinc-500 text-sm font-normal">• {song.album}</span>}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              onClick={() => onEnterStageMode(song)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-bold rounded-xl shadow-xs transition-all active:scale-95 text-xs"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Stage Mode</span>
            </button>

            <button
              onClick={() => setTwoColumns(!twoColumns)}
              className={`p-2 rounded-xl border transition-colors ${
                twoColumns
                  ? 'bg-zinc-200 border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-600 dark:text-white'
                  : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-600 hover:text-zinc-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-white'
              }`}
              title={twoColumns ? 'Jeden sloupec' : 'Dva sloupce'}
            >
              {twoColumns ? <Columns className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-600 hover:text-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-white rounded-xl transition-colors"
              title="Vytisknout / Exportovat do PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Transposition & Musical Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 no-print text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Transpose */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1">
              <span className="text-zinc-500 dark:text-zinc-400 font-semibold mr-2">Transpozice:</span>
              <button
                onClick={() => setTransposeSemitones((prev) => prev - 1)}
                className="w-6 h-6 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-700 dark:text-zinc-300 font-bold transition-colors"
                title="-1 půltón"
              >
                -
              </button>
              <span className="w-10 text-center font-mono font-bold text-zinc-900 dark:text-white">
                {transposeSemitones > 0 ? `+${transposeSemitones}` : transposeSemitones}
              </span>
              <button
                onClick={() => setTransposeSemitones((prev) => prev + 1)}
                className="w-6 h-6 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-700 dark:text-zinc-300 font-bold transition-colors"
                title="+1 půltón"
              >
                +
              </button>
              {transposeSemitones !== 0 && (
                <button
                  onClick={() => setTransposeSemitones(0)}
                  className="ml-1 text-[11px] text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 underline"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Capo */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1">
              <span className="text-zinc-500 dark:text-zinc-400 font-semibold mr-2">Capo:</span>
              <select
                value={capoFret}
                onChange={(e) => setCapoFret(Number(e.target.value))}
                className="bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white font-bold rounded-lg px-2 py-0.5 text-xs focus:outline-hidden"
              >
                <option value="0">Bez kapa (0)</option>
                {Array.from({ length: 9 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Pražec {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Enharmonic toggle */}
            <button
              onClick={() => setPreferFlats(!preferFlats)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border font-semibold transition-colors ${
                preferFlats
                  ? 'bg-zinc-200 border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-600 dark:text-white'
                  : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-600 hover:text-zinc-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
              title="Přepnout křížky (#) a béčka (b)"
            >
              <Hash className="w-3 h-3" />
              <span>{preferFlats ? 'Béčka (b)' : 'Křížky (#)'}</span>
            </button>

            {/* Instrument switcher */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-0.5">
              <button
                onClick={() => setInstrument('guitar')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  instrument === 'guitar'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-bold'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                Kytara
              </button>
              <button
                onClick={() => setInstrument('ukulele')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  instrument === 'ukulele'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-bold'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                Ukulele
              </button>
            </div>

            {/* Left handed */}
            <button
              onClick={() => setLeftHanded(!leftHanded)}
              className={`px-2.5 py-1 rounded-xl border font-medium transition-colors ${
                leftHanded
                  ? 'bg-zinc-200 border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-600 dark:text-white'
                  : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-600 hover:text-zinc-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Levoruký
            </button>
          </div>

          {/* External Music Links */}
          <div className="flex items-center gap-1.5">
            {song.youtube_url && (
              <a
                href={song.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 hover:text-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-white rounded-xl font-medium transition-all"
                title="Pustit na YouTube"
              >
                <YoutubeIcon className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                <span>YouTube</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </a>
            )}

            {song.spotify_url && (
              <a
                href={song.spotify_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 hover:text-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-white rounded-xl font-medium transition-all"
                title="Pustit na Spotify"
              >
                <SpotifyIcon className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                <span>Spotify</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </a>
            )}

            {song.deezer_url && (
              <a
                href={song.deezer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 hover:text-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-white rounded-xl font-medium transition-all"
                title="Pustit na Deezer"
              >
                <DeezerIcon className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                <span>Deezer</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </a>
            )}

            {youtubeVideoId && (
              <button
                onClick={() => setShowYoutubeEmbed(!showYoutubeEmbed)}
                className="flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white rounded-xl dark:border-zinc-800 transition-colors"
                title="Přehrát přímo v okně"
              >
                {showYoutubeEmbed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                <span>Přehrávač</span>
              </button>
            )}
          </div>
        </div>

        {/* Embedded YouTube Player */}
        {showYoutubeEmbed && youtubeVideoId && (
          <div className="mt-4 border-t border-zinc-200 dark:border-zinc-800/90 pt-4 flex justify-center no-print">
            <div className="w-full max-w-xl aspect-video rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
                title={song.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Tags */}
        {song.tags && song.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800/80">
            <TagIcon className="w-3 h-3 text-zinc-400 dark:text-zinc-500 mr-1" />
            {song.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-md text-[11px]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Lyrics & Chords Container */}
      <div
        className={`bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/90 rounded-3xl p-6 md:p-10 shadow-xs dark:shadow-2xl font-song leading-relaxed transition-all ${
          twoColumns ? 'song-two-columns' : ''
        }`}
        style={{ fontSize: `${fontSize}px` }}
      >
        {parsedLines.map((line, lineIdx) => {
          if (line.type === 'empty') {
            return <div key={lineIdx} className="h-5" />;
          }

          if (line.type === 'directive') {
            return null;
          }

          if (line.type === 'section-header') {
            return (
              <div
                key={lineIdx}
                className="font-bold text-zinc-500 dark:text-zinc-400 mt-5 mb-2 tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-1 text-xs uppercase"
              >
                {line.rawText}
              </div>
            );
          }

          const isLyricOnlyLine = !line.segments?.some((s) => s.chord);
          const isChordOnlyLine =
            !!line.segments && line.segments.length > 0 && line.segments.every((s) => !s.lyric.trim());

          return (
            <div
              key={lineIdx}
              className={`flex flex-wrap items-end ${
                isLyricOnlyLine ? 'min-h-[1.4em]' : 'min-h-[2.4em]'
              } py-0.5 leading-none`}
            >
              {line.segments?.map((seg, segIdx) => {
                const transposedChord = seg.chord
                  ? transposeChord(seg.chord, transposeSemitones, preferFlats, notation)
                  : undefined;

                return (
                  <div key={segIdx} className="inline-flex flex-col items-start mr-1 mb-1">
                    {transposedChord ? (
                      <span className="mb-0.5 font-bold select-none text-[0.9em]">
                        <ChordTooltip
                          chord={transposedChord}
                          instrument={instrument}
                          leftHanded={leftHanded}
                          onInstrumentChange={(newInst) => setInstrument(newInst)}
                        />
                      </span>
                    ) : (
                      !isLyricOnlyLine && <span className="h-5 mb-0.5" />
                    )}

                    {(!isChordOnlyLine || seg.lyric.trim().length > 0) && (
                      <span className="text-zinc-900 dark:text-zinc-100 whitespace-pre">
                        {seg.lyric || (isChordOnlyLine ? '' : ' ')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Floating Autoscroll Toolbar */}
      <div className="no-print">
        <AutoscrollToolbar
          isPlaying={isScrolling}
          speed={scrollSpeed}
          onTogglePlay={() => setIsScrolling(!isScrolling)}
          onChangeSpeed={handleSpeedChange}
          onResetToTop={handleResetToTop}
          fontSize={fontSize}
          onChangeFontSize={(newSize) => setFontSize(newSize)}
        />
      </div>
    </div>
  );
};
