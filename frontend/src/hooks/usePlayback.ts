import { useCallback, useRef, useState } from "react";
import * as Tone from "tone";

import { Channel } from "@/types/music";
import {
  InstrumentPreset,
  useAudioEngine,
} from "@/hooks/useAudioEngine";

export function usePlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const animationFrameRef = useRef<number | null>(
    null
  );

  const {
    play: enginePlay,
    stop: engineStop,
    rewind: engineRewind,
    playKeyNote,
    stopKeyNote,
    setPreset,
    currentPreset,
    setMasterVolume,
    exportAudio,
  } = useAudioEngine();

  const play = useCallback(
    async (channels: Channel[], bpm: number) => {
      await enginePlay(channels, bpm);
      setIsPlaying(true);

      const maxBeats = Math.max(
        ...channels.flatMap((ch) =>
          ch.notes.map(
            (n) => n.start_time + n.duration
          )
        ),
        0
      );
      const maxSeconds = (maxBeats * 60) / bpm;

      const loop = () => {
        const transport = Tone.getTransport();
        const current = transport.seconds;
        setElapsed(current);

        if (current >= maxSeconds) {
          stopPlayback();
          return;
        }

        animationFrameRef.current =
          requestAnimationFrame(loop);
      };

      animationFrameRef.current =
        requestAnimationFrame(loop);
    },
    [enginePlay]
  );

  const stopPlayback = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(
        animationFrameRef.current
      );
      animationFrameRef.current = null;
    }
    engineStop();
    setIsPlaying(false);
  }, [engineStop]);

  const rewind = useCallback(() => {
    stopPlayback();
    engineRewind();
    setElapsed(0);
  }, [stopPlayback, engineRewind]);

  return {
    isPlaying,
    elapsed,
    play,
    stop: stopPlayback,
    rewind,
    playKeyNote,
    stopKeyNote,
    setPreset,
    currentPreset,
    setMasterVolume,
    exportAudio,
  };
}
