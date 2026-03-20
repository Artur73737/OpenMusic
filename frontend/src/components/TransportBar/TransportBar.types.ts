import { InstrumentPreset } from "@/hooks/useAudioEngine";

export interface TransportBarProps {
  isPlaying: boolean;
  elapsed: number;
  bpm: number;
  currentPreset: InstrumentPreset;
  masterVolume: number;
  hasComposition: boolean;
  onPlay: () => void;
  onStop: () => void;
  onRewind: () => void;
  onBpmChange: (bpm: number) => void;
  onPresetChange: (preset: InstrumentPreset) => void;
  onVolumeChange: (volume: number) => void;
  onExport: (format: "wav" | "mp3" | "flac") => void;
}
