import { ChatMessage, Session } from "@/types/music";

export interface ChatPanelProps {
  messages: ChatMessage[];
  sessions: Session[];
  isLoading: boolean;
  onSubmit: (prompt: string) => void;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}
