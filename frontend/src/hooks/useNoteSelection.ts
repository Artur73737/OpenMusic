import { useCallback, useState } from "react";

import { ChannelRole, MusicScore, Note, NoteSelection } from "@/types/music";

export function useNoteSelection() {
  const [selected, setSelected] = useState<NoteSelection | null>(null);

  const selectNote = useCallback((channelId: ChannelRole, noteIndex: number) => {
    setSelected({ channelId, noteIndex });
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(null);
  }, []);

  const selectedNote = useCallback(
    (composition: MusicScore): Note | null => {
      if (!selected) return null;

      const channel = composition.channels.find(
        (ch) => ch.id === selected.channelId
      );
      if (!channel) return null;

      return channel.notes[selected.noteIndex] ?? null;
    },
    [selected]
  );

  const updateNote = useCallback(
    (
      composition: MusicScore,
      patch: Partial<Note>
    ): MusicScore | null => {
      if (!selected) return null;

      const newChannels = composition.channels.map((channel) => {
        if (channel.id !== selected.channelId) return channel;

        const newNotes = channel.notes.map((note, index) => {
          if (index !== selected.noteIndex) return note;
          return { ...note, ...patch };
        });

        return { ...channel, notes: newNotes };
      });

      return { ...composition, channels: newChannels };
    },
    [selected]
  );

  return {
    selected,
    selectNote,
    clearSelection,
    selectedNote,
    updateNote,
  };
}
