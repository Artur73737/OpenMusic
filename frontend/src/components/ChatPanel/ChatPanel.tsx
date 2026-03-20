import { useEffect, useRef, useState } from "react";

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

export function ChatPanel({
  messages,
  sessions,
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
            {msg.content}
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
      <div className="chat__input-area">
        <div className="chat__input-row">
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
            rows={2}
            className="chat__textarea"
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !draft.trim()}
            className="chat__submit"
          >
            Genera
          </button>
        </div>
      </div>
    </div>
  );
}
