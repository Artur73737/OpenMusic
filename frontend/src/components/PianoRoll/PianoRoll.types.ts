import { Channel, ChannelRole } from "@/types/music";

export interface PianoRollProps {
  channels: Channel[];
  bpm: number;
  playheadTime: number;
  onNoteClick: (channelId: ChannelRole, noteIndex: number) => void;
  onKeyDown: (pitch: string, octave: number) => void;
  onKeyUp: (pitch: string, octave: number) => void;
  selectedChannelId?: ChannelRole | null;
  selectedNoteIndex?: number | null;
}

export const NOTE_NAMES = [
  "B", "A#", "A", "G#", "G", "F#",
  "F", "E", "D#", "D", "C#", "C",
] as const;

export const NOTE_NAMES_ASC = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
] as const;

export const OCTAVE_RANGE = { min: 2, max: 7 } as const;

export const TOTAL_KEYS =
  (OCTAVE_RANGE.max - OCTAVE_RANGE.min + 1) * 12;

export function isBlackKey(noteName: string): boolean {
  return noteName.includes("#");
}

export function rowToNote(row: number): {
  pitch: string;
  octave: number;
} {
  const pitch = NOTE_NAMES[row % 12];
  const octave =
    OCTAVE_RANGE.max - Math.floor(row / 12);
  return { pitch, octave };
}

export function noteToRow(
  pitch: string,
  octave: number
): number {
  const idx = NOTE_NAMES.indexOf(
    pitch as (typeof NOTE_NAMES)[number]
  );
  if (idx === -1) return 0;
  return (OCTAVE_RANGE.max - octave) * 12 + idx;
}
