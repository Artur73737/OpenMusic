import { Channel } from "@/types/music";

export interface TopBarProps {
  title: string | null;
  channels: Channel[];
  error: string | null;
  isLoading: boolean;
  hasComposition: boolean;
  onClearNotes: () => void;
  onNewSession: () => void;
}
