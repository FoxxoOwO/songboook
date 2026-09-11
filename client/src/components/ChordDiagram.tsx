import React from 'react';
import type { ChordDefinition } from '../types/index.js';
import { useTheme } from '../context/ThemeContext.js';

interface ChordDiagramProps {
  chord: ChordDefinition;
  leftHanded?: boolean;
  width?: number;
  height?: number;
  showTitle?: boolean;
}

export const ChordDiagram: React.FC<ChordDiagramProps> = ({
  chord,
  leftHanded = false,
  width = 150,
  height = 180,
  showTitle = true,
}) => {
  const { theme } = useTheme();
  const isDark = theme !== 'light';
  const isUkulele = chord.instrument === 'ukulele';
  const numStrings = isUkulele ? 4 : 6;
  const numFrets = 5;

  const baseFret = chord.baseFret || 1;
  const hasNut = baseFret === 1;

  const marginX = 25;
  const marginTop = showTitle ? 38 : 28;
  const plotWidth = width - marginX * 2;
  const plotHeight = height - marginTop - 25;

  const stringSpacing = plotWidth / (numStrings - 1);
  const fretSpacing = plotHeight / numFrets;

  let frets = [...chord.frets];
  let fingers = chord.fingers ? [...chord.fingers] : [];

  if (leftHanded) {
    frets = frets.reverse();
    fingers = fingers.reverse();
  }

  const getStringX = (index: number) => marginX + index * stringSpacing;
  const getFretY = (fretNum: number) => marginTop + fretNum * fretSpacing;

  return (
    <div className="inline-flex flex-col items-center bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl select-none">

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Chord Title */}
        {showTitle && (
          <text
            x={width / 2}
            y={20}
            textAnchor="middle"
            className="text-base font-bold"
            fill={isDark ? '#ffffff' : '#18181b'}
            style={{ fontSize: '16px', fontWeight: 'bold' }}
          >
            {chord.name}
          </text>
        )}

        {/* Base Fret Indicator */}
        {!hasNut && (
          <text
            x={marginX - 14}
            y={getFretY(0.7)}
            textAnchor="end"
            className="text-xs font-semibold"
            fill={isDark ? '#a1a1aa' : '#71717a'}
            style={{ fontSize: '11px' }}
          >
            {baseFret}fr
          </text>
        )}

        {/* Nut (crisp thick bar) */}
        {hasNut ? (
          <line
            x1={marginX - 2}
            y1={marginTop}
            x2={marginX + plotWidth + 2}
            y2={marginTop}
            stroke={isDark ? '#ffffff' : '#18181b'}
            strokeWidth="5"
            strokeLinecap="round"
          />
        ) : (
          <line
            x1={marginX}
            y1={marginTop}
            x2={marginX + plotWidth}
            y2={marginTop}
            stroke={isDark ? '#52525b' : '#a1a1aa'}
            strokeWidth="2"
          />
        )}

        {/* Frets */}
        {Array.from({ length: numFrets + 1 }).map((_, f) => (
          <line
            key={`fret-${f}`}
            x1={marginX}
            y1={getFretY(f)}
            x2={marginX + plotWidth}
            y2={getFretY(f)}
            stroke={isDark ? '#3f3f46' : '#d4d4d8'}
            strokeWidth={f === 0 && !hasNut ? 2 : 1.2}
          />
        ))}

        {/* Strings */}
        {Array.from({ length: numStrings }).map((_, s) => (
          <line
            key={`string-${s}`}
            x1={getStringX(s)}
            y1={marginTop}
            x2={getStringX(s)}
            y2={marginTop + plotHeight}
            stroke={isDark ? '#a1a1aa' : '#71717a'}
            strokeWidth={s === 0 && !leftHanded ? 2.0 : s === numStrings - 1 && leftHanded ? 2.0 : 1.2}
          />
        ))}

        {/* Barre Chord Indicator */}
        {chord.barre && (
          (() => {
            const relFret = chord.barre.fret - (baseFret - 1);
            if (relFret >= 1 && relFret <= numFrets) {
              const fromIdx = leftHanded ? numStrings - chord.barre.toString : chord.barre.fromString - 1;
              const toIdx = leftHanded ? numStrings - chord.barre.fromString : chord.barre.toString - 1;
              const y = getFretY(relFret - 0.5);
              return (
                <rect
                  x={getStringX(Math.min(fromIdx, toIdx)) - 7}
                  y={y - 6}
                  width={Math.abs(getStringX(toIdx) - getStringX(fromIdx)) + 14}
                  height={12}
                  rx={6}
                  fill={isDark ? '#ffffff' : '#18181b'}
                  opacity={0.95}
                />
              );
            }
            return null;
          })()
        )}

        {/* String Markers */}
        {frets.map((fret, sIdx) => {
          const stringX = getStringX(sIdx);
          const finger = fingers[sIdx];

          // Muted string (X)
          if (fret === -1) {
            return (
              <text
                key={`mute-${sIdx}`}
                x={stringX}
                y={marginTop - 8}
                textAnchor="middle"
                className="text-xs font-bold"
                fill={isDark ? '#a1a1aa' : '#71717a'}
                style={{ fontSize: '13px' }}
              >
                ×
              </text>
            );
          }

          // Open string (O)
          if (fret === 0) {
            return (
              <circle
                key={`open-${sIdx}`}
                cx={stringX}
                cy={marginTop - 11}
                r={4}
                fill="none"
                stroke={isDark ? '#ffffff' : '#18181b'}
                strokeWidth="1.5"
              />
            );
          }

          // Fretted dot
          const relFret = fret - (baseFret - 1);
          if (relFret >= 1 && relFret <= numFrets) {
            const dotY = getFretY(relFret - 0.5);
            return (
              <g key={`dot-${sIdx}`}>
                <circle
                  cx={stringX}
                  cy={dotY}
                  r={7}
                  fill={isDark ? '#ffffff' : '#18181b'}
                  stroke={isDark ? '#09090b' : '#f4f4f5'}
                  strokeWidth="1.5"
                />
                {finger > 0 && (
                  <text
                    x={stringX}
                    y={dotY + 3.5}
                    textAnchor="middle"
                    className="text-[9px] font-bold"
                    fill={isDark ? '#09090b' : '#ffffff'}
                    style={{ fontSize: '9px', fontWeight: 'bold' }}
                  >
                    {finger}
                  </text>
                )}
              </g>
            );
          }

          return null;
        })}
      </svg>

      <div className="flex items-center justify-between w-full mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 px-1 border-t border-zinc-200 dark:border-zinc-800/80 pt-1">
        <span>{isUkulele ? 'Ukulele' : 'Kytara'}</span>
        {leftHanded && <span className="text-zinc-700 dark:text-zinc-300 font-medium">Levoruký</span>}
      </div>
    </div>
  );
};
