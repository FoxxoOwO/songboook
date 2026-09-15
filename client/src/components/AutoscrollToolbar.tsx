import React from 'react';
import { Play, Pause, RotateCcw, Minus, Plus, Type } from 'lucide-react';

interface AutoscrollToolbarProps {
  isPlaying: boolean;
  speed: number;
  onTogglePlay: () => void;
  onChangeSpeed: (newSpeed: number) => void;
  onResetToTop: () => void;
  fontSize: number;
  onChangeFontSize: (newSize: number) => void;
}

export const AutoscrollToolbar: React.FC<AutoscrollToolbarProps> = ({
  isPlaying,
  speed,
  onTogglePlay,
  onChangeSpeed,
  onResetToTop,
  fontSize,
  onChangeFontSize,
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl px-4 py-2.5 flex items-center gap-3 md:gap-5 text-zinc-900 dark:text-zinc-100 max-w-[95vw] sm:max-w-max">
      {/* Play / Pause button */}
      <button
        onClick={onTogglePlay}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all active:scale-95 shadow-md ${
          isPlaying
            ? 'bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 ring-2 ring-zinc-400/50'
            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-white dark:border-zinc-700'
        }`}
        title="Mezerník = Start / Pauza"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
        <span className="hidden sm:inline">{isPlaying ? 'Pauza' : 'Autoscroll'}</span>
      </button>

      {/* Speed control */}
      <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mr-1 hidden sm:inline">Rychlost:</span>
        <button
          onClick={() => {
            const newSpeed = speed <= 1 ? 1 : speed <= 10 ? speed - 1 : Math.max(10, Math.floor((speed - 1) / 5) * 5);
            onChangeSpeed(newSpeed);
          }}
          disabled={speed <= 1}
          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          title="Zpomalit"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <input
          type="range"
          min="1"
          max="60"
          value={speed}
          onChange={(e) => onChangeSpeed(Number(e.target.value))}
          className="w-16 sm:w-24 accent-zinc-900 dark:accent-white cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg"
        />

        <button
          onClick={() => {
            const newSpeed = speed < 10 ? speed + 1 : Math.min(60, speed + 5);
            onChangeSpeed(newSpeed);
          }}
          disabled={speed >= 60}
          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          title="Zrychlit"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <span className="text-xs font-mono font-bold text-zinc-900 dark:text-white min-w-6 text-center">
          {speed}
        </span>
      </div>

      {/* Rewind */}
      <button
        onClick={onResetToTop}
        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
        title="Zpět na začátek"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* Font size */}
      <div className="hidden md:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
        <Type className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 mr-1" />
        <button
          onClick={() => onChangeFontSize(Math.max(12, fontSize - 2))}
          className="px-1.5 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-bold"
        >
          -
        </button>
        <span className="font-mono text-zinc-800 dark:text-zinc-200">{fontSize}px</span>
        <button
          onClick={() => onChangeFontSize(Math.min(28, fontSize + 2))}
          className="px-1.5 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
};

