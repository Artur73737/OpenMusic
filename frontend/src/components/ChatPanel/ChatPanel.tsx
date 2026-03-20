import { useEffect, useRef, useState } from "react";

import { Composition } from "@/types/music";
import { ChatPanelProps } from "./ChatPanel.types";

function formatSessionDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday =
    date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function downloadCompositionJson(
  composition: Composition | null | undefined
): void {
  if (!composition) return;

  const data = JSON.stringify(composition, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const timestamp = new Date().toISOString().split("T")[0];
  a.download = `composition_${composition.melody.title.replace(/\s+/g, "_")}_${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ChatPanel({
  messages,
  sessions,
  composition,
  isLoading,
  onSubmit,
  onLoadSession,
  onDeleteSession,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [showSessions, setShowSessions] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = () => {
    if (!draft.trim() || isLoading) return;
    onSubmit(draft.trim());
    setDraft("");
  };

  return (
    <div className="chat">
      {/* Header */}
      <div className="chat__header">
        <div className="chat__header-left">
          <span className="chat__header-dot" />
          <span className="chat__header-label">
            AI COMPOSER
          </span>
        </div>
        <button
          onClick={() => setShowSessions(!showSessions)}
          className={`chat__sessions-btn ${
            showSessions ? "active" : ""
          }`}
        >
          Sessioni ({sessions.length})
        </button>
      </div>

      {/* Sessions */}
      {showSessions && sessions.length > 0 && (
        <div className="chat__sessions">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="chat__session-item"
            >
              <button
                onClick={() => {
                  onLoadSession(session.id);
                  setShowSessions(false);
                }}
                className="flex-1 text-left"
              >
                <div className="chat__session-title">
                  {session.title}
                </div>
                <div className="chat__session-meta">
                  {formatSessionDate(session.timestamp)}
                  {" - "}
                  {session.messages.length} msg
                </div>
              </button>
              <button
                onClick={() =>
                  onDeleteSession(session.id)
                }
                className="chat__session-delete"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="chat__messages">
        {messages.length === 0 && !showSessions && (
          <div className="chat__empty">
            Descrivi la musica che vuoi creare
          </div>
        )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`chat__bubble chat__bubble--${msg.role}`}
        >
          <span className="chat__bubble-content">
            {msg.content}
          </span>
          {msg.role === "assistant" && msg.composition && (
            <button
              onClick={() => downloadCompositionJson(msg.composition)}
              className="chat__download-btn"
              title="Scarica JSON"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          )}
        </div>
      ))}

        {isLoading && (
          <div className="chat__loading-dots">
            <span className="chat__loading-dot" />
            <span className="chat__loading-dot" />
            <span className="chat__loading-dot" />
          </div>
        )}
        <div ref={endRef} />
      </div>

  {/* Input */}
      <div className="chat__input">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Descrivi la musica..."
          rows={1}
          className="chat__input-field"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !draft.trim()}
          className="chat__send-btn"
          aria-label="Invia"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9" />
          </svg>
        </button>
      </div>
    </div>
);
}
