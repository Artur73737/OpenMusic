import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";

import { Channel } from "@/types/music";

/* ── Types ── */

export type InstrumentPreset =
  | "piano"
  | "electric_piano"
  | "synth_pad"
  | "strings"
  | "organ"
  | "pluck"
  | "bass_synth"
  | "bell";

interface ActiveKey {
  synth: Tone.PolySynth | Tone.MonoSynth;
}

/* ── Preset factory ── */

function createSynth(
  preset: InstrumentPreset
): Tone.PolySynth | Tone.MonoSynth {
  switch (preset) {
    case "piano":
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: {
          attack: 0.02,
          decay: 0.8,
          sustain: 0.1,
          release: 1.2,
        },
        volume: -12,
      });

    case "electric_piano":
      return new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3,
        modulationIndex: 8,
        oscillator: { type: "sine" },
        envelope: {
          attack: 0.01,
          decay: 0.6,
          sustain: 0.15,
          release: 0.8,
        },
        modulation: { type: "sine" },
        modulationEnvelope: {
          attack: 0.01,
          decay: 0.3,
          sustain: 0,
          release: 0.3,
        },
        volume: -14,
      });

    case "synth_pad":
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "fatsine",
          count: 3,
          spread: 20,
        },
        envelope: {
          attack: 0.5,
          decay: 0.3,
          sustain: 0.7,
          release: 2.0,
        },
        volume: -16,
      });

    case "strings":
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "fatsine",
          count: 4,
          spread: 25,
        },
        envelope: {
          attack: 0.4,
          decay: 0.3,
          sustain: 0.8,
          release: 2.0,
        },
        volume: -16,
      });

    case "organ":
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: {
          attack: 0.03,
          decay: 0.1,
          sustain: 0.8,
          release: 0.15,
        },
        volume: -14,
      });

    case "pluck":
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: {
          attack: 0.003,
          decay: 0.3,
          sustain: 0.0,
          release: 0.4,
        },
        volume: -12,
      });

    case "bass_synth":
      return new Tone.MonoSynth({
        oscillator: { type: "triangle" },
        envelope: {
          attack: 0.02,
          decay: 0.3,
          sustain: 0.6,
          release: 0.5,
        },
        filterEnvelope: {
          attack: 0.02,
          decay: 0.3,
          sustain: 0.4,
          release: 0.5,
          baseFrequency: 80,
          octaves: 2,
        },
        volume: -10,
      });

    case "bell":
      return new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 5,
        modulationIndex: 10,
        oscillator: { type: "sine" },
        envelope: {
          attack: 0.01,
          decay: 1.5,
          sustain: 0.0,
          release: 2.0,
        },
        modulation: { type: "sine" },
        modulationEnvelope: {
          attack: 0.01,
          decay: 0.5,
          sustain: 0.0,
          release: 0.5,
        },
        volume: -16,
      });

    default:
      return new Tone.PolySynth(Tone.Synth, {
        volume: -12,
      });
  }
}

/* ── Effects chain ── */

function createEffectsChain() {
  const filter = new Tone.Filter({
    frequency: 6000,
    type: "lowpass",
    rolloff: -24,
  });
  const reverb = new Tone.Reverb({
    decay: 3,
    wet: 0.2,
  });
  const compressor = new Tone.Compressor({
    threshold: -20,
    ratio: 4,
    attack: 0.01,
    release: 0.2,
  });
  const limiter = new Tone.Limiter(-6);

  return { filter, reverb, compressor, limiter };
}

/* ── Waveform / role mapping ── */

const ROLE_TO_PRESET: Record<string, InstrumentPreset> = {
  melody: "piano",
  bass: "bass_synth",
  chords: "synth_pad",
};

function toNoteName(pitch: string, octave: number): string {
  return `${pitch}${octave}`;
}

/* ── Hook ── */

export function useAudioEngine() {
  const [currentPreset, setCurrentPreset] =
    useState<InstrumentPreset>("piano");
  const currentPresetRef = useRef(currentPreset);

  const effectsRef = useRef<ReturnType<
    typeof createEffectsChain
  > | null>(null);
  const channelSynthsRef = useRef<
    Map<string, Tone.PolySynth | Tone.MonoSynth>
  >(new Map());
  const activeKeysRef = useRef<Map<string, ActiveKey>>(
    new Map()
  );
  const scheduledEventsRef = useRef<number[]>([]);

  /* ── Initialize effects ── */

  const initEffects = useCallback(() => {
    if (!effectsRef.current) {
      const fx = createEffectsChain();
      // Chain: synth -> compressor -> filter -> limiter -> reverb -> out
      fx.reverb.toDestination();
      fx.limiter.connect(fx.reverb);
      fx.filter.connect(fx.limiter);
      fx.compressor.connect(fx.filter);
      effectsRef.current = fx;
    }
    return effectsRef.current;
  }, []);

  /* ── Cleanup ── */

  useEffect(() => {
    return () => {
      channelSynthsRef.current.forEach((s) =>
        s.dispose()
      );
      activeKeysRef.current.forEach((ak) =>
        ak.synth.dispose()
      );
      if (effectsRef.current) {
        effectsRef.current.reverb.dispose();
        effectsRef.current.compressor.dispose();
        effectsRef.current.filter.dispose();
        effectsRef.current.limiter.dispose();
      }
    };
  }, []);

  /* ── Set preset ── */

  const setPreset = useCallback(
    (preset: InstrumentPreset) => {
      setCurrentPreset(preset);
      currentPresetRef.current = preset;
    },
    []
  );

  /* ── Schedule channels for playback ── */

  const scheduleChannels = useCallback(
    (channels: Channel[], bpm: number) => {
      const fx = initEffects();

      // Clear previous
      channelSynthsRef.current.forEach((s) =>
        s.dispose()
      );
      channelSynthsRef.current.clear();
      scheduledEventsRef.current.forEach((id) =>
        Tone.getTransport().clear(id)
      );
      scheduledEventsRef.current = [];

      Tone.getTransport().cancel();
      Tone.getTransport().bpm.value = bpm;
      Tone.getTransport().position = 0;

      const beatDuration = 60 / bpm;

    channels.forEach((channel) => {
      const presetName = channel.instrument as InstrumentPreset;

      const synth = createSynth(presetName);
        synth.connect(fx.compressor);
        channelSynthsRef.current.set(
          channel.id,
          synth
        );

        channel.notes.forEach((note) => {
          const noteName = toNoteName(
            note.pitch,
            note.octave
          );

          // start_time is in BEATS, convert to seconds
          const startSeconds =
            note.start_time * beatDuration;
          // duration is in BEATS, convert to seconds
          const durSeconds = Math.max(
            0.05,
            note.duration * beatDuration
          );

          // Velocity 0-1 range, clamped
          const velocity = Math.max(
            0.05,
            Math.min(0.9, note.velocity / 127)
          );

          const eventId =
            Tone.getTransport().schedule(
              (time) => {
                try {
                  if (
                    synth instanceof Tone.MonoSynth
                  ) {
                    synth.triggerAttackRelease(
                      noteName,
                      durSeconds,
                      time,
                      velocity
                    );
                  } else {
                    synth.triggerAttackRelease(
                      noteName,
                      durSeconds,
                      time,
                      velocity
                    );
                  }
                } catch {
                  // Ignore scheduling errors for
                  // disposed synths
                }
              },
              startSeconds
            );
          scheduledEventsRef.current.push(eventId);
        });
      });
    },
    [initEffects]
  );

  /* ── Play / stop / rewind ── */

  const play = useCallback(
    async (channels: Channel[], bpm: number) => {
      await Tone.start();
      scheduleChannels(channels, bpm);
      Tone.getTransport().start();
    },
    [scheduleChannels]
  );

  const stop = useCallback(() => {
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
    channelSynthsRef.current.forEach((s) => {
      if (s instanceof Tone.PolySynth) {
        s.releaseAll();
      }
    });
  }, []);

  const rewind = useCallback(() => {
    Tone.getTransport().position = 0;
  }, []);

  /* ── Piano key playback ── */

  const playKeyNote = useCallback(
    (pitch: string, octave: number) => {
      const key = `${pitch}${octave}`;
      if (activeKeysRef.current.has(key)) return;

      const fx = initEffects();
      const synth = createSynth(
        currentPresetRef.current
      );
      synth.connect(fx.compressor);

      const noteName = toNoteName(pitch, octave);

      try {
        if (synth instanceof Tone.MonoSynth) {
          synth.triggerAttack(noteName, Tone.now());
        } else {
          synth.triggerAttack(
            noteName,
            Tone.now(),
            0.7
          );
        }
      } catch {
        // Ignore
      }

      activeKeysRef.current.set(key, { synth });
    },
    [initEffects]
  );

  const stopKeyNote = useCallback(
    (pitch: string, octave: number) => {
      const key = `${pitch}${octave}`;
      const active = activeKeysRef.current.get(key);
      if (!active) return;

      const noteName = toNoteName(pitch, octave);

      try {
        if (active.synth instanceof Tone.MonoSynth) {
          active.synth.triggerRelease(Tone.now());
        } else {
          (
            active.synth as Tone.PolySynth
          ).triggerRelease(noteName, Tone.now());
        }
      } catch {
        // Ignore
      }

      setTimeout(() => {
        active.synth.dispose();
      }, 2500);

      activeKeysRef.current.delete(key);
    },
    []
  );

  /* ── Master volume ── */

  const setMasterVolume = useCallback(
    (percent: number) => {
      const db =
        percent <= 0
          ? -Infinity
          : 20 * Math.log10(percent / 100);
      Tone.getDestination().volume.value = db;
    },
    []
  );

  /* ── Offline export ── */

  const exportAudio = useCallback(
    async (
      channels: Channel[],
      bpm: number,
      format: "wav" | "mp3" | "flac"
    ) => {
      const beatDuration = 60 / bpm;
      const maxTime = Math.max(
        ...channels.flatMap((ch) =>
          ch.notes.map(
            (n) =>
              (n.start_time + n.duration) *
              beatDuration
          )
        ),
        4
      );
      const renderDuration = maxTime + 2;

      const buffer = await Tone.Offline(
        ({ transport }) => {
          transport.bpm.value = bpm;

          const filter = new Tone.Filter({
            frequency: 6000,
            type: "lowpass",
            rolloff: -24,
          });
          const reverb = new Tone.Reverb({
            decay: 3,
            wet: 0.2,
          });
          const compressor = new Tone.Compressor({
            threshold: -20,
            ratio: 4,
            attack: 0.01,
            release: 0.2,
          });
          const limiter = new Tone.Limiter(-6);

          reverb.toDestination();
          limiter.connect(reverb);
          filter.connect(limiter);
          compressor.connect(filter);

      channels.forEach((channel) => {
        const preset = channel.instrument as InstrumentPreset;

        const synth = createSynth(preset);
            synth.connect(compressor);

            channel.notes.forEach((note) => {
              const noteName = `${note.pitch}${note.octave}`;
              const startSec =
                note.start_time * beatDuration;
              const durSec = Math.max(
                0.05,
                note.duration * beatDuration
              );
              const vel = Math.max(
                0.05,
                Math.min(0.9, note.velocity / 127)
              );

              transport.schedule((time) => {
                try {
                  if (
                    synth instanceof Tone.MonoSynth
                  ) {
                    synth.triggerAttackRelease(
                      noteName,
                      durSec,
                      time,
                      vel
                    );
                  } else {
                    synth.triggerAttackRelease(
                      noteName,
                      durSec,
                      time,
                      vel
                    );
                  }
                } catch {
                  /* ignore */
                }
              }, startSec);
            });
          });

          transport.start(0);
        },
        renderDuration,
        2,
        44100
      );

      if (format === "wav") {
        downloadWav(buffer, bpm);
      } else {
        alert(
          `${format.toUpperCase()} export requires ffmpeg. WAV will be exported instead.`
        );
        downloadWav(buffer, bpm);
      }
    },
    []
  );

  return {
    currentPreset,
    setPreset,
    play,
    stop,
    rewind,
    playKeyNote,
    stopKeyNote,
    scheduleChannels,
    setMasterVolume,
    exportAudio,
  };
}

/* ── WAV encoder ── */

function downloadWav(
  buffer: Tone.ToneAudioBuffer,
  bpm: number
) {
  const audioBuffer = buffer.get();
  if (!audioBuffer) return;

  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const bytesPerSample = 4; // float32
  const dataSize = length * numChannels * bytesPerSample;

  const headerSize = 44;
  const arr = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(arr);

  // RIFF header
  writeStr(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(view, 8, "WAVE");

  // fmt
  writeStr(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 3, true); // float format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(
    28,
    sampleRate * numChannels * bytesPerSample,
    true
  );
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, 32, true);

  // data
  writeStr(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(audioBuffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      view.setFloat32(offset, channels[c][i], true);
      offset += 4;
    }
  }

  const blob = new Blob([arr], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `composition_${bpm}bpm.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function writeStr(
  view: DataView,
  offset: number,
  str: string
) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
