import React, { useState, useRef, useEffect } from 'react';
import type { InstrumentType } from '../types/index.js';
import { getChordDefinition } from '../utils/chordDatabase.js';
import { ChordDiagram } from './ChordDiagram.js';
import { playChordAudio } from '../utils/audioSynth.js';
import { Volume2, Music } from 'lucide-react';

interface ChordTooltipProps {
  chord: string;
  instrument?: InstrumentType;
  leftHanded?: boolean;
  onInstrumentChange?: (inst: InstrumentType) => void;
}

export const ChordTooltip: React.FC<ChordTooltipProps> = ({
  chord,
  instrument = 'guitar',
  leftHanded = false,
  onInstrumentChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeInst, setActiveInst] = useState<InstrumentType>(instrument);
  const containerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setActiveInst(instrument);
  }, [instrument]);

  const chordDef = getChordDefinition(chord, activeInst);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    if (!isOpen && chordDef) {
      playChordAudio(chord, activeInst);
    }
  };

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    playChordAudio(chord, activeInst);
  };

  const toggleInstrument = (e: React.MouseEvent, inst: InstrumentType) => {
    e.stopPropagation();
    setActiveInst(inst);
    if (onInstrumentChange) {
      onInstrumentChange(inst);
    }
  };

  return (
    <span
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        onClick={handleClick}
        className="font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 dark:text-white dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-700/80 px-1.5 py-0.5 rounded cursor-pointer transition-colors shadow-2xs"
        title="Najetím zobrazíte prstoklad"
      >
        {chord}
      </span>

      {isOpen && chordDef && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 p-2.5 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1 mb-2.5 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg text-xs border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={(e) => toggleInstrument(e, 'guitar')}
              className={`px-2.5 py-0.5 rounded-md transition-colors ${
                activeInst === 'guitar'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-bold'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Kytara
            </button>
            <button
              onClick={(e) => toggleInstrument(e, 'ukulele')}
              className={`px-2.5 py-0.5 rounded-md transition-colors ${
                activeInst === 'ukulele'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-bold'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Ukulele
            </button>
          </div>

          <ChordDiagram chord={chordDef} leftHanded={leftHanded} width={140} height={170} />

          <button
            onClick={handlePlayAudio}
            className="mt-2.5 flex items-center gap-1.5 px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 hover:text-black border border-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 dark:hover:text-white dark:border-zinc-700 rounded-lg text-xs font-semibold transition-all active:scale-95"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Přehrát zvuk</span>
          </button>
        </div>
      )}

      {isOpen && !chordDef && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 p-2.5 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl text-xs text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-bold mb-1.5">
            <Music className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>{chord}</span>
          </div>
          <button
            onClick={handlePlayAudio}
            className="flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 hover:text-black border border-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 dark:hover:text-white dark:border-zinc-700 rounded-lg text-[11px]"
          >
            <Volume2 className="w-3 h-3" /> Přehrát tón
          </button>
        </div>
      )}
    </span>
  );
};
