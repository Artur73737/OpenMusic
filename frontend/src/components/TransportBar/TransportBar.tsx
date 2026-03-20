import { useState } from "react";

import { InstrumentPreset } from "@/hooks/useAudioEngine";
import { TransportBarProps } from "./TransportBar.types";

const PRESET_LABELS: Record<InstrumentPreset, string> = {
  piano: "Piano",
  electric_piano: "E.Piano",
  synth_pad: "Synth Pad",
  strings: "Strings",
  organ: "Organ",
  pluck: "Pluck",
  bass_synth: "Bass",
  bell: "Bell",
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${String(secs).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}

function formatBars(seconds: number, bpm: number): string {
  const beatDuration = 60 / bpm;
  const totalBeats = seconds / beatDuration;
  const bar = Math.floor(totalBeats / 4) + 1;
  const beat = Math.floor(totalBeats % 4) + 1;
  return `${bar}.${beat}`;
}

export function TransportBar({
  isPlaying,
  elapsed,
  bpm,
  currentPreset,
  masterVolume,
  hasComposition,
  onPlay,
  onStop,
  onRewind,
  onBpmChange,
  onPresetChange,
  onVolumeChange,
  onExport,
}: TransportBarProps) {
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="transport">
      {/* Controls */}
      <div className="transport__controls">
        <button
          onClick={onRewind}
          className="transport__btn"
          title="Rewind"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        <button
          onClick={isPlaying ? onStop : onPlay}
          className={`transport__btn ${isPlaying ? "transport__btn--active" : "transport__btn--play"}`}
        >
          {isPlaying ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={onStop}
          className="transport__btn"
          title="Stop"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        </button>
      </div>

      <div className="transport__divider" />

      {/* BPM */}
      <div className="transport__field">
        <span className="transport__field-label">BPM</span>
        <input
          type="number"
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          min={40}
          max={240}
          className="transport__field-input"
        />
      </div>

      <div className="transport__divider" />

      {/* Instrument */}
      <div className="transport__field">
        <span className="transport__field-label">INST</span>
        <select
          value={currentPreset}
          onChange={(e) =>
            onPresetChange(e.target.value as InstrumentPreset)
          }
          className="transport__field-select"
        >
          {Object.entries(PRESET_LABELS).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>
      </div>

      <div className="transport__divider" />

      {/* Master Volume */}
      <div className="transport__field">
        <span className="transport__field-label">VOL</span>
        <input
          type="range"
          min={0}
          max={100}
          value={masterVolume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="transport__volume-slider"
        />
        <span className="transport__volume-value">
          {masterVolume}
        </span>
      </div>

      <div className="transport__divider" />

      {/* Position */}
      <div className="transport__position">
        <div className="transport__position-item">
          <span className="transport__position-label">BAR</span>
          <span className="transport__position-value">
            {formatBars(elapsed, bpm)}
          </span>
        </div>
        <div className="transport__position-item">
          <span className="transport__position-label">TIME</span>
          <span className="transport__position-value">
            {formatTime(elapsed)}
          </span>
        </div>
      </div>

      <div className="transport__spacer" />

      {/* Export */}
      {hasComposition && (
        <div className="transport__export">
          <button
            onClick={() => setShowExport(!showExport)}
            className="transport__btn transport__btn--export"
            title="Export audio"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
          </button>

          {showExport && (
            <div className="transport__export-menu">
              <button
                className="transport__export-item"
                onClick={() => { onExport("wav"); setShowExport(false); }}
              >
                WAV
              </button>
              <button
                className="transport__export-item"
                onClick={() => { onExport("mp3"); setShowExport(false); }}
              >
                MP3
              </button>
              <button
                className="transport__export-item"
                onClick={() => { onExport("flac"); setShowExport(false); }}
              >
                FLAC
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status */}
      {isPlaying && (
        <div className="transport__status">
          <span className="transport__status-dot" />
          PLAYING
        </div>
      )}
    </div>
  );
}
