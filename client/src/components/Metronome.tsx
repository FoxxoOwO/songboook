import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Plus, Minus, Disc } from 'lucide-react';
import { playMetronomeClick } from '../utils/audioSynth.js';

interface MetronomeProps {
  initialBpm?: number;
  onBpmChange?: (bpm: number) => void;
}

export const Metronome: React.FC<MetronomeProps> = ({
  initialBpm = 100,
  onBpmChange,
}) => {
  const [bpm, setBpm] = useState<number>(initialBpm);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [beatsPerBar, setBeatsPerBar] = useState<number>(4);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const tapTimesRef = useRef<number[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setBpm(initialBpm);
  }, [initialBpm]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentBeat(0);
      return;
    }

    const intervalMs = (60 / bpm) * 1000;

    timerRef.current = window.setInterval(() => {
      setCurrentBeat((prev) => {
        const nextBeat = (prev + 1) % beatsPerBar;
        const isDownbeat = nextBeat === 0;

        if (!isMuted) {
          playMetronomeClick(isDownbeat);
        }

        return nextBeat;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, bpm, beatsPerBar, isMuted]);

  const updateBpm = (newBpm: number) => {
    const clamped = Math.max(30, Math.min(260, newBpm));
    setBpm(clamped);
    if (onBpmChange) onBpmChange(clamped);
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const taps = tapTimesRef.current;

    if (taps.length > 0 && now - taps[taps.length - 1] > 2500) {
      tapTimesRef.current = [now];
      return;
    }

    taps.push(now);
    if (taps.length > 5) taps.shift();

    if (taps.length >= 2) {
      let intervals = 0;
      for (let i = 1; i < taps.length; i++) {
        intervals += taps[i] - taps[i - 1];
      }
      const avgInterval = intervals / (taps.length - 1);
      const calculatedBpm = Math.round(60000 / avgInterval);
      updateBpm(calculatedBpm);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Disc className={`w-5 h-5 text-zinc-900 dark:text-white ${isPlaying ? 'animate-spin' : ''}`} />
          Metronom
        </h3>

        {/* Time signature select */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl text-xs font-semibold">
          {[2, 3, 4, 6].map((beats) => (
            <button
              key={beats}
              onClick={() => setBeatsPerBar(beats)}
              className={`px-2 py-1 rounded-lg transition-colors ${
                beatsPerBar === beats
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-bold'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              {beats}/4
            </button>
          ))}
        </div>
      </div>

      {/* Visual Pulsing Beat Indicators */}
      <div className="flex items-center justify-center gap-3 my-5 py-3.5 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800/80">
        {Array.from({ length: beatsPerBar }).map((_, i) => {
          const isActive = isPlaying && currentBeat === i;
          const isDownbeat = i === 0;

          return (
            <div
              key={i}
              className={`w-5 h-5 rounded-full transition-all duration-75 ${
                isActive
                  ? isDownbeat
                    ? 'bg-zinc-900 dark:bg-white scale-125 shadow-[0_0_12px_rgba(0,0,0,0.4)] dark:shadow-[0_0_12px_rgba(255,255,255,0.9)]'
                    : 'bg-zinc-600 dark:bg-zinc-300 scale-110 shadow-[0_0_8px_rgba(0,0,0,0.3)] dark:shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                  : 'bg-zinc-200 border border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700'
              }`}
            />
          );
        })}
      </div>

      {/* BPM Display */}
      <div className="flex items-center justify-center gap-4 my-4">
        <button
          onClick={() => updateBpm(bpm - 5)}
          className="p-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-300 rounded-xl transition-colors active:scale-95"
          title="-5 BPM"
        >
          <Minus className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-5xl font-black font-mono tracking-tighter text-zinc-900 dark:text-white">
            {bpm}
          </span>
          <span className="block text-xs uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-widest mt-0.5">
            BPM
          </span>
        </div>

        <button
          onClick={() => updateBpm(bpm + 5)}
          className="p-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-300 rounded-xl transition-colors active:scale-95"
          title="+5 BPM"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* BPM Slider */}
      <div className="px-3 mb-6">
        <input
          type="range"
          min="40"
          max="240"
          value={bpm}
          onChange={(e) => updateBpm(Number(e.target.value))}
          className="w-full accent-zinc-900 dark:accent-white cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-900">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-md ${
            isPlaying
              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-white dark:border-zinc-700'
              : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black'
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isPlaying ? 'Zastavit' : 'Spustit'}</span>
        </button>

        <button
          onClick={handleTapTempo}
          className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-900 active:text-white text-zinc-800 border border-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:active:bg-white dark:active:text-black dark:text-zinc-200 dark:border-zinc-700 font-bold rounded-xl text-xs transition-all active:scale-95 uppercase tracking-wider"
          title="Vyťukejte tempo v rytmu"
        >
          Tap Tempo
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-2.5 rounded-xl border transition-colors ${
            isMuted
              ? 'bg-zinc-200 border-zinc-300 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-400'
              : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-white'
          }`}
          title={isMuted ? 'Zvuk vypnut (pouze vizuální)' : 'Zvuk zapnut'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

