import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, AlertCircle, RefreshCw } from 'lucide-react';
import {
  TUNING_PRESETS,
  autoCorrelate,
  getPitchDetails,
} from '../utils/pitchDetector.js';
import type { PitchDetectionResult } from '../utils/pitchDetector.js';
import { playReferenceTone } from '../utils/audioSynth.js';
import type { TuningPreset, PitchTarget } from '../types/index.js';

export const InstrumentTuner: React.FC = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<TuningPreset>(TUNING_PRESETS[0]);
  const [pitchData, setPitchData] = useState<PitchDetectionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedString, setSelectedString] = useState<PitchTarget | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const startListening = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });

      mediaStreamRef.current = stream;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);
      processAudio();
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMsg(
        'Nepodařilo se získat přístup k mikrofonu. Povolte prosím mikrofon v nastavení prohlížeče.'
      );
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsListening(false);
    setPitchData(null);
  };

  const processAudio = () => {
    if (!analyserRef.current || !audioCtxRef.current) return;

    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);

    const result = autoCorrelate(buffer, audioCtxRef.current.sampleRate);
    if (result) {
      const details = getPitchDetails(result.freq);
      setPitchData(details);
    }

    animFrameRef.current = requestAnimationFrame(processAudio);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const handlePlayStringRef = (target: PitchTarget) => {
    setSelectedString(target);
    playReferenceTone(target.freq, 2.0);
  };

  const cents = pitchData?.cents ?? 0;
  const clampedCents = Math.max(-50, Math.min(50, cents));
  const needleAngle = (clampedCents / 50) * 45;

  const inTune = pitchData?.inTune ?? false;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">
            🎸 Chromatická ladička
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Nalaďte svou kytaru nebo ukulele pomocí mikrofonu nebo si poslechněte referenční tón
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {TUNING_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setSelectedPreset(preset)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedPreset.id === preset.id
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-md'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl flex items-center gap-3 text-zinc-800 dark:text-zinc-200 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-zinc-500 dark:text-zinc-400" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Visual Tuner Dial Gauge */}
        <div className="relative flex flex-col items-center justify-center my-6 bg-zinc-950 dark:bg-black rounded-3xl border border-zinc-800 p-8 overflow-hidden shadow-inner">
          {inTune && isListening && (
            <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
          )}

          <div className="relative w-64 h-32 mb-2 flex items-end justify-center">
            <div className="absolute w-60 h-60 rounded-full border-4 border-zinc-800 border-t-zinc-600 -top-28" />

            <div className="absolute top-2 w-full flex justify-between px-3 text-[11px] font-mono font-bold text-zinc-500">
              <span>-50</span>
              <span className="text-zinc-400">-25</span>
              <span className="text-white font-extrabold text-xs">0</span>
              <span className="text-zinc-400">+25</span>
              <span>+50</span>
            </div>

            {/* Target notch */}
            <div className="absolute top-7 w-2 h-4 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />

            {/* Needle */}
            <div
              className="absolute bottom-0 w-1.5 h-28 bg-white origin-bottom transition-transform duration-100 ease-out rounded-full shadow-lg"
              style={{
                transform: `rotate(${needleAngle}deg)`,
              }}
            >
              <div className="w-3 h-3 rounded-full bg-white -top-1.5 -left-0.75 absolute shadow-xs" />
            </div>

            <div className="absolute bottom-[-10px] w-6 h-6 rounded-full bg-zinc-700 border-2 border-black z-10" />
          </div>

          {/* Detected Note & Frequency */}
          <div className="flex flex-col items-center mt-3">
            {isListening && pitchData ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-6xl font-black font-mono tracking-tighter ${
                      inTune ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]' : 'text-zinc-100'
                    }`}
                  >
                    {pitchData.noteName}
                  </span>
                  <span className="text-2xl font-bold text-zinc-400">
                    {pitchData.octave}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm font-mono text-zinc-300">
                    {pitchData.frequency} Hz
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      inTune
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    {clampedCents > 0 ? `+${clampedCents}` : clampedCents} centů
                  </span>
                </div>

                {inTune && (
                  <span className="text-xs font-bold text-white mt-1.5 uppercase tracking-wider">
                    ✓ Naladěno
                  </span>
                )}
              </>
            ) : isListening ? (
              <div className="flex items-center gap-2 text-zinc-400 animate-pulse my-4">
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span className="text-sm">Poslouchám... Zahrajte strunu</span>
              </div>
            ) : (
              <div className="text-zinc-500 my-4 text-center">
                <span className="text-3xl font-mono block font-bold text-zinc-700">--</span>
                <span className="text-xs">Klikněte na Spustit mikrofon pro ladění</span>
              </div>
            )}
          </div>
        </div>

        {/* Start / Stop Listening Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-base shadow-md transition-all active:scale-95 ${
              isListening
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span>{isListening ? 'Zastavit mikrofon' : 'Spustit mikrofon'}</span>
          </button>
        </div>

        {/* Pitch Pipe */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-zinc-900 dark:text-white" />
              Referenční tóny (Pitch Pipe podle sluchu)
            </span>
            <span className="text-xs text-zinc-500">Kliknutím zahrajete strunu</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {selectedPreset.strings.map((str, idx) => (
              <button
                key={str.name + idx}
                onClick={() => handlePlayStringRef(str)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${
                  selectedString?.name === str.name
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black dark:border-white shadow-md'
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-200'
                }`}
              >
                <span className="text-lg font-bold font-mono">{str.name}</span>
                <span className="text-[10px] font-mono mt-0.5 opacity-70">{str.freq} Hz</span>
                {str.stringIndex && (
                  <span className="text-[10px] mt-1 font-semibold opacity-60">
                    {str.stringIndex}. struna
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

