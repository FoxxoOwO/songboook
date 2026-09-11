import React, { useState, useEffect, useRef } from 'react';
import type { Song } from '../types/index.js';
import { parseSongContent } from '../utils/chordParser.js';
import { transposeChord } from '../utils/transposer.js';
import { ChordTooltip } from './ChordTooltip.js';
import {
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Play,
  Pause,
  Columns,
  Square,
  Type,
  RotateCcw,
} from 'lucide-react';

interface StageModeProps {
  songs: Song[];
  initialIndex?: number;
  onExit: () => void;
}

export const StageMode: React.FC<StageModeProps> = ({
  songs,
  initialIndex = 0,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [transpose, setTranspose] = useState(0);
  const [twoColumns, setTwoColumns] = useState(true);
  const [fontSize, setFontSize] = useState(20);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(20);

  const activeSong = songs[currentIndex] || songs[0];
  const scrollAnimRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (activeSong) {
      setScrollSpeed(activeSong.autoscroll_speed || 20);
      setTranspose(0);
      setIsScrolling(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentIndex, activeSong]);

  useEffect(() => {
    if (!isScrolling) {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
      return;
    }

    const step = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const pxPerSec = scrollSpeed * 1.8;
      window.scrollBy(0, pxPerSec * deltaTime);

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5) {
        setIsScrolling(false);
        return;
      }

      scrollAnimRef.current = requestAnimationFrame(step);
    };

    lastTimeRef.current = performance.now();
    scrollAnimRef.current = requestAnimationFrame(step);

    return () => {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    };
  }, [isScrolling, scrollSpeed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PageDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextSong();
      } else if (e.key === 'PageUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevSong();
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsScrolling((prev) => !prev);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, songs.length]);

  const handleNextSong = () => {
    if (currentIndex < songs.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevSong = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (!activeSong) return null;

  const parsedLines = parseSongContent(activeSong.content);

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-8 pt-20 pb-32 select-none stage-mode">
      {/* Fixed Sticky Stage Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-zinc-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold border border-zinc-800 transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ukončit Stage Mode</span>
          </button>

          <span className="text-xs font-mono font-bold text-white bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg">
            {currentIndex + 1} / {songs.length}
          </span>
        </div>

        {/* Current Song Title & Capo in header */}
        <div className="text-center min-w-0 px-2">
          <h2 className="text-lg sm:text-xl font-black text-white truncate">
            {activeSong.title}
          </h2>
          <p className="text-xs text-zinc-400 truncate">
            {activeSong.artist}
            {activeSong.capo > 0 && (
              <span className="ml-2 text-zinc-300 font-bold">• Capo {activeSong.capo}</span>
            )}
          </p>
        </div>

        {/* Next / Prev Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevSong}
            disabled={currentIndex === 0}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl border border-zinc-800 disabled:opacity-30 transition-colors"
            title="Předchozí skladba (PageUp / Šipka vlevo)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextSong}
            disabled={currentIndex === songs.length - 1}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl border border-zinc-800 disabled:opacity-30 transition-colors"
            title="Další skladba (PageDown / Šipka vpravo)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stage Song Lyrics Container */}
      <div
        className={`max-w-6xl mx-auto font-song leading-relaxed tracking-wide ${
          twoColumns ? 'song-two-columns' : ''
        }`}
        style={{ fontSize: `${fontSize}px` }}
      >
        {parsedLines.map((line, lineIdx) => {
          if (line.type === 'empty') return <div key={lineIdx} className="h-6" />;
          if (line.type === 'section-header') {
            return (
              <div
                key={lineIdx}
                className="font-bold text-zinc-400 mt-5 mb-2 text-sm uppercase border-b border-zinc-800 pb-1 tracking-wider"
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
                isLyricOnlyLine ? 'min-h-[1.5em]' : 'min-h-[2.5em]'
              } py-0.5`}
            >
              {line.segments?.map((seg, segIdx) => {
                const transposedChord = seg.chord
                  ? transposeChord(seg.chord, transpose, false, 'international')
                  : undefined;

                return (
                  <div key={segIdx} className="inline-flex flex-col items-start mr-1.5 mb-1">
                    {transposedChord ? (
                      <span className="mb-1 text-white font-extrabold text-[1.05em] select-none">
                        <ChordTooltip chord={transposedChord} />
                      </span>
                    ) : (
                      !isLyricOnlyLine && <span className="h-6 mb-1" />
                    )}
                    {(!isChordOnlyLine || seg.lyric.trim().length > 0) && (
                      <span className="text-zinc-100 font-medium whitespace-pre">
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

      {/* Floating Bottom Stage Controls */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl px-4 py-2 flex items-center gap-3 text-xs backdrop-blur-md">
        <button
          onClick={() => setIsScrolling(!isScrolling)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors ${
            isScrolling
              ? 'bg-white text-black'
              : 'bg-zinc-900 text-white border border-zinc-800'
          }`}
          title="Mezerník = Start / Pauza"
        >
          {isScrolling ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isScrolling ? 'Pauza' : 'Scroll'}</span>
        </button>

        <div className="flex items-center bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-xl">
          <span className="text-zinc-400 mr-1.5">T:</span>
          <button
            onClick={() => setTranspose((t) => t - 1)}
            className="w-5 h-5 flex items-center justify-center font-bold text-zinc-300 hover:text-white"
          >
            -
          </button>
          <span className="w-7 text-center font-mono font-bold text-white">
            {transpose > 0 ? `+${transpose}` : transpose}
          </span>
          <button
            onClick={() => setTranspose((t) => t + 1)}
            className="w-5 h-5 flex items-center justify-center font-bold text-zinc-300 hover:text-white"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-xl">
          <Type className="w-3.5 h-3.5 text-zinc-400" />
          <button
            onClick={() => setFontSize((s) => Math.max(14, s - 2))}
            className="px-1 font-bold text-zinc-300 hover:text-white"
          >
            -
          </button>
          <span className="font-mono text-zinc-200">{fontSize}</span>
          <button
            onClick={() => setFontSize((s) => Math.min(32, s + 2))}
            className="px-1 font-bold text-zinc-300 hover:text-white"
          >
            +
          </button>
        </div>

        <button
          onClick={() => setTwoColumns(!twoColumns)}
          className={`p-1.5 rounded-xl border transition-colors ${
            twoColumns
              ? 'bg-zinc-800 border-zinc-600 text-white'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
          title={twoColumns ? 'Jeden sloupec' : 'Dva sloupce'}
        >
          {twoColumns ? <Columns className="w-4 h-4" /> : <Square className="w-4 h-4" />}
        </button>

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-colors"
          title="Zpět na začátek"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
