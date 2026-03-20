import { useCallback, useMemo, useState } from "react";

import { StudioConfig } from "@/components/GlobalConfig/GlobalConfig.types";
import { InstrumentPreset } from "@/hooks/useAudioEngine";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useComposition } from "@/hooks/useComposition";
import { useNoteSelection } from "@/hooks/useNoteSelection";
import { usePlayback } from "@/hooks/usePlayback";
import { ChannelRole } from "@/types/music";

const DEFAULT_CONFIG: StudioConfig = {
  bpm: 120,
  key: "C major",
  timeSignature: "4/4",
  model: "meta/llama-3.1-70b-instruct",
  temperature: 0.7,
  topP: 0.9,
  generateMode: "both",
  quantization: "1/4",
  durationSeconds: 15,
};

export function useStudioState() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [masterVolume, setMasterVolume] = useState(80);

  const composition = useComposition();
  const playback = usePlayback();
  const noteSelection = useNoteSelection();
  const chatHistory = useChatHistory();

  /* ── Config updaters ── */

  const updateConfig = useCallback(
    (patch: Partial<StudioConfig>) => {
      setConfig((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  /* ── Preset ── */

  const handlePresetChange = useCallback(
    (preset: InstrumentPreset) => {
      playback.setPreset(preset);
    },
    [playback.setPreset]
  );

  /* ── Submit prompt ── */

  const handleSubmit = useCallback(
    async (prompt: string) => {
      chatHistory.addUserMessage(prompt);
      const result = await composition.generate({
        prompt,
        model: config.model,
        duration_seconds: config.durationSeconds,
        bpm: config.bpm,
      });
    if (result) {
      const totalNotes = result.melody.channels.reduce(
        (sum, ch) => sum + ch.notes.length,
        0
      );
      chatHistory.addAssistantMessage(
        `Generato: "${result.melody.title}" ` +
          `in ${result.melody.key} ` +
          `a ${result.melody.bpm} BPM ` +
          `(${totalNotes} note, ${config.durationSeconds}s)`,
        result
      );
      chatHistory.saveSession(
        result.melody.title,
        result
      );
    }
    },
    [
      composition.generate,
      config.model,
      config.durationSeconds,
      config.bpm,
      chatHistory.addUserMessage,
      chatHistory.addAssistantMessage,
      chatHistory.saveSession,
    ]
  );

  /* ── Playback ── */

  const handlePlay = useCallback(() => {
    const comp = composition.composition;
    if (comp?.melody.channels) {
      playback.play(
        comp.melody.channels,
        comp.melody.bpm
      );
    }
  }, [composition.composition, playback.play]);

  /* ── BPM change (rescales existing notes) ── */

  const handleBpmChange = useCallback(
    (newBpm: number) => {
      const comp = composition.composition;
      if (comp) {
        const scaleFactor = comp.melody.bpm / newBpm;
        const newChannels = comp.melody.channels.map(
          (ch) => ({
            ...ch,
            notes: ch.notes.map((n) => ({
              ...n,
              start_time: n.start_time * scaleFactor,
              duration: n.duration * scaleFactor,
            })),
          })
        );
        composition.updateComposition({
          ...comp,
          melody: {
            ...comp.melody,
            bpm: newBpm,
            channels: newChannels,
          },
        });
      }
      updateConfig({ bpm: newBpm });
    },
    [composition.composition, composition.updateComposition]
  );

  /* ── Note click ── */

  const handleNoteClick = useCallback(
    (channelId: ChannelRole, noteIndex: number) => {
      noteSelection.selectNote(channelId, noteIndex);
    },
    [noteSelection.selectNote]
  );

  /* ── Selected note data ── */

  const selectedNoteData = useMemo(() => {
    const comp = composition.composition;
    if (!comp || !noteSelection.selected) return null;

    const note = noteSelection.selectedNote(comp.melody);
    if (!note) return null;

    const channel = comp.melody.channels.find(
      (ch) => ch.id === noteSelection.selected!.channelId
    );
    return {
      note,
      channelId: noteSelection.selected.channelId,
      waveform: channel?.waveform,
      adsr: channel?.adsr,
    };
  }, [
    composition.composition,
    noteSelection.selected,
    noteSelection.selectedNote,
  ]);

  /* ── Note update ── */

  const handleNoteUpdate = useCallback(
    (patch: Record<string, unknown>) => {
      const comp = composition.composition;
      if (!comp) return;
      const updated = noteSelection.updateNote(
        comp.melody,
        patch
      );
      if (updated) {
        composition.updateComposition({
          ...comp,
          melody: updated,
        });
      }
    },
    [
      composition.composition,
      noteSelection.updateNote,
      composition.updateComposition,
    ]
  );

  /* ── Waveform change ── */

  const handleWaveformChange = useCallback(
    (waveform: "sine" | "triangle" | "square" | "sawtooth") => {
      const comp = composition.composition;
      if (!comp || !noteSelection.selected) return;

      const updatedChannels = comp.melody.channels.map(
        (ch) =>
          ch.id === noteSelection.selected!.channelId
            ? { ...ch, waveform }
            : ch
      );
      composition.updateComposition({
        ...comp,
        melody: {
          ...comp.melody,
          channels: updatedChannels,
        },
      });
    },
    [
      composition.composition,
      noteSelection.selected,
      composition.updateComposition,
    ]
  );

  /* ── ADSR change ── */

  const handleAdsrChange = useCallback(
    (adsr: {
      attack: number;
      decay: number;
      sustain: number;
      release: number;
    }) => {
      const comp = composition.composition;
      if (!comp || !noteSelection.selected) return;

      const updatedChannels = comp.melody.channels.map(
        (ch) =>
          ch.id === noteSelection.selected!.channelId
            ? { ...ch, adsr }
            : ch
      );
      composition.updateComposition({
        ...comp,
        melody: {
          ...comp.melody,
          channels: updatedChannels,
        },
      });
    },
    [
      composition.composition,
      noteSelection.selected,
      composition.updateComposition,
    ]
  );

  /* ── Load session ── */

  const handleLoadSession = useCallback(
    (sessionId: string) => {
      const loaded = chatHistory.loadSession(sessionId);
      if (loaded?.composition) {
        composition.updateComposition(loaded.composition);
      }
    },
    [chatHistory.loadSession, composition.updateComposition]
  );

  /* ── Clear actions ── */

  const clearComposition = useCallback(() => {
    composition.clear();
    noteSelection.clearSelection();
    playback.stop();
  }, [composition.clear, noteSelection.clearSelection, playback.stop]);

  const clearAll = useCallback(() => {
    clearComposition();
    chatHistory.clearHistory();
  }, [clearComposition, chatHistory.clearHistory]);

  const handleVolumeChange = useCallback(
    (volume: number) => {
      setMasterVolume(volume);
      playback.setMasterVolume(volume);
    },
    [playback.setMasterVolume]
  );

  const handleExport = useCallback(
    (format: "wav" | "mp3" | "flac") => {
      const channels =
        composition.composition?.melody.channels;
      if (!channels) return;
      const bpm =
        composition.composition?.melody.bpm ??
        config.bpm;
      playback.exportAudio(channels, bpm, format);
    },
    [
      composition.composition,
      config.bpm,
      playback.exportAudio,
    ]
  );

  return {
    config,
    updateConfig,
    currentPreset: playback.currentPreset,
    handlePresetChange,

    composition: composition.composition,
    isLoading: composition.isLoading,
    error: composition.error,

    isPlaying: playback.isPlaying,
    elapsed: playback.elapsed,
    handlePlay,
    stop: playback.stop,
    rewind: playback.rewind,
    playKeyNote: playback.playKeyNote,
    stopKeyNote: playback.stopKeyNote,
    handleBpmChange,
    masterVolume,
    handleVolumeChange,
    handleExport,

    selected: noteSelection.selected,
    selectedNoteData,
    handleNoteClick,
    handleNoteUpdate,
    handleWaveformChange,
    handleAdsrChange,
    clearSelection: noteSelection.clearSelection,

    messages: chatHistory.messages,
    sessions: chatHistory.sessions,
    handleSubmit,
    handleLoadSession,
    deleteSession: chatHistory.deleteSession,
    clearComposition,
    clearAll,
  };
}
