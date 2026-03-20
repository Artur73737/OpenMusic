import { TopBarProps } from "./TopBar.types";

const CHANNEL_COLORS: Record<string, string> = {
  melody: "var(--accent-orange)",
  bass: "var(--accent-green)",
  chords: "var(--accent-blue)",
};

export function TopBar({
  title,
  channels,
  error,
  isLoading,
  hasComposition,
  onClearNotes,
  onNewSession,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="top-bar__left">
        <h1 className="top-bar__logo">
          MUSIC MCP STUDIO
        </h1>

        {title && (
          <span className="top-bar__title">{title}</span>
        )}

        {channels.length > 0 && (
          <div className="top-bar__channels">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="top-bar__channel"
              >
                <span
                  className="top-bar__dot"
                  style={{
                    background:
                      CHANNEL_COLORS[ch.id] || "#888",
                  }}
                />
                <span className="top-bar__channel-name">
                  {ch.id}
                </span>
                <span className="top-bar__channel-count">
                  {ch.notes.length}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="top-bar__right">
        {isLoading && (
          <div className="top-bar__loading">
            <span className="top-bar__spinner" />
            Generazione...
          </div>
        )}

        {error && (
          <span className="top-bar__error">
            {error.slice(0, 60)}
          </span>
        )}

        {hasComposition && (
          <button
            onClick={onClearNotes}
            className="top-bar__action"
          >
            Pulisci Note
          </button>
        )}

        <button
          onClick={onNewSession}
          className="top-bar__action top-bar__action--new"
        >
          Nuova Sessione
        </button>
      </div>
    </header>
  );
}
