export type Waveform = "sine" | "triangle" | "square" | "sawtooth";
export type TimeSignature = "4/4" | "3/4" | "6/8";
export type ChannelRole = "melody" | "bass" | "chords";
export type BeatType = "bass" | "chord" | "melody" | "rest";
export type Instrument =
  | "piano"
  | "electric_piano"
  | "synth_pad"
  | "strings"
  | "organ"
  | "pluck"
  | "bass_synth"
  | "bell";

export interface Adsr {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface Note {
  pitch: string;
  octave: number;
  start_time: number;
  duration: number;
  velocity: number;
}

export interface Channel {
  id: ChannelRole;
  name: string;
  waveform: Waveform;
  instrument: Instrument;
  adsr: Adsr;
  notes: Note[];
}

export interface MusicScore {
  title: string;
  bpm: number;
  key: string;
  time_signature: TimeSignature;
  channels: Channel[];
}

export interface RhythmBeat {
  beat: number;
  duration: number;
  accent: boolean;
  type: BeatType;
}

export interface RhythmScore {
  bpm: number;
  time_signature: TimeSignature;
  bars: number;
  pattern: RhythmBeat[];
}

export interface Composition {
  melody: MusicScore;
  rhythm: RhythmScore;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  composition?: Composition;
}

export interface Session {
  id: string;
  title: string;
  timestamp: number;
  composition: Composition | null;
  messages: ChatMessage[];
}

export interface NoteSelection {
  channelId: ChannelRole;
  noteIndex: number;
}
