import { TimeSignature } from "@/types/music";

export interface StudioConfig {
  bpm: number;
  key: string;
  timeSignature: TimeSignature;
  model: string;
  temperature: number;
  topP: number;
  generateMode: "melody" | "rhythm" | "both";
  quantization: "1/4" | "1/8" | "1/16" | "free";
  durationSeconds: number;
}

export interface GlobalConfigProps {
  config: StudioConfig;
  onConfigChange: (
    patch: Partial<StudioConfig>
  ) => void;
}

export const MUSICAL_KEYS = [
  "C major",
  "G major",
  "D major",
  "A major",
  "E major",
  "B major",
  "F major",
  "Bb major",
  "Eb major",
  "Ab major",
  "A minor",
  "E minor",
  "B minor",
  "D minor",
  "G minor",
  "C minor",
  "F minor",
];

export const DURATION_OPTIONS = [
  { value: 5, label: "5s" },
  { value: 10, label: "10s" },
  { value: 15, label: "15s" },
  { value: 20, label: "20s" },
  { value: 30, label: "30s" },
  { value: 45, label: "45s" },
  { value: 60, label: "1m" },
  { value: 90, label: "1.5m" },
  { value: 120, label: "2m" },
];
