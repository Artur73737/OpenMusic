import { Adsr, ChannelRole, Note, Waveform } from "@/types/music";

export interface NoteInspectorProps {
  note: Note | null;
  channelId: ChannelRole | null;
  waveform: Waveform | null;
  adsr: Adsr | null;
  onPitchChange: (pitch: string) => void;
  onOctaveChange: (octave: number) => void;
  onVelocityChange: (velocity: number) => void;
  onDurationChange: (duration: number) => void;
  onStartTimeChange: (startTime: number) => void;
  onWaveformChange: (waveform: Waveform) => void;
  onAdsrChange: (adsr: Adsr) => void;
  onClose: () => void;
}

export const PITCHES = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
];
