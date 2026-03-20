import { NoteInspectorProps } from "./NoteInspector.types";

function InspectorField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label
        className="text-xs tracking-wider"
        style={{ color: "#555", fontSize: "9px" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function NoteInspector({
  note,
  channelId,
  waveform,
  adsr,
  onPitchChange,
  onOctaveChange,
  onVelocityChange,
  onDurationChange,
  onStartTimeChange,
  onWaveformChange,
  onAdsrChange,
  onClose,
}: NoteInspectorProps) {
  if (!note || !channelId) {
    return (
      <div className="p-4" style={{ color: "#333" }}>
        <p className="text-xs">
          Seleziona una nota per modificarla
        </p>
      </div>
    );
  }

  const channelColors: Record<string, string> = {
    melody: "#f0883e",
    bass: "#4ade80",
    chords: "#60a5fa",
  };

  const color = channelColors[channelId] || "#888";

  return (
    <div
      className="p-4 space-y-4"
      style={{ background: "#0d0d0d" }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: color }}
          />
          <span
            className="text-sm font-mono font-semibold"
            style={{
              color,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {note.pitch}{note.octave}
          </span>
          <span
            className="text-xs"
            style={{ color: "#555" }}
          >
            {channelId}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-5 h-5 flex items-center justify-center rounded text-xs"
          style={{
            background: "#1a1a1a",
            color: "#555",
            border: "1px solid #2a2a2a",
          }}
        >
          x
        </button>
      </div>

      <InspectorField label="PITCH">
        <div className="grid grid-cols-6 gap-1">
          {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(
            (pitch) => (
              <button
                key={pitch}
                onClick={() => onPitchChange(pitch)}
                className="py-1 text-xs rounded"
                style={{
                  background:
                    note.pitch === pitch ? color : "#1a1a1a",
                  color:
                    note.pitch === pitch ? "#0d0d0d" : "#777",
                  border: `1px solid ${
                    note.pitch === pitch ? color : "#2a2a2a"
                  }`,
                  fontWeight: note.pitch === pitch ? 600 : 400,
                  fontSize: "10px",
                }}
              >
                {pitch}
              </button>
            )
          )}
        </div>
      </InspectorField>

      <InspectorField label="OTTAVA">
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onOctaveChange(Math.max(2, note.octave - 1))
            }
            className="w-7 h-7 flex items-center justify-center rounded text-xs"
            style={{
              background: "#1a1a1a",
              color: "#888",
              border: "1px solid #2a2a2a",
            }}
          >
            -
          </button>
          <span
            className="flex-1 text-center text-sm font-mono"
            style={{
              color: "#e8e8e8",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {note.octave}
          </span>
          <button
            onClick={() =>
              onOctaveChange(Math.min(7, note.octave + 1))
            }
            className="w-7 h-7 flex items-center justify-center rounded text-xs"
            style={{
              background: "#1a1a1a",
              color: "#888",
              border: "1px solid #2a2a2a",
            }}
          >
            +
          </button>
        </div>
      </InspectorField>

      <InspectorField label={`VELOCITY: ${note.velocity}`}>
        <input
          type="range"
          min={1}
          max={127}
          value={note.velocity}
          onChange={(e) =>
            onVelocityChange(Number(e.target.value))
          }
          className="w-full"
        />
      </InspectorField>

      <InspectorField label={`DURATA: ${note.duration.toFixed(2)} beats`}>
        <input
          type="range"
          min={0.1}
          max={8}
          step={0.1}
          value={note.duration}
          onChange={(e) =>
            onDurationChange(Number(e.target.value))
          }
          className="w-full"
        />
      </InspectorField>

      <InspectorField label={`INIZIO: ${note.start_time.toFixed(2)} beats`}>
        <input
          type="range"
          min={0}
          max={32}
          step={0.25}
          value={note.start_time}
          onChange={(e) =>
            onStartTimeChange(Number(e.target.value))
          }
          className="w-full"
        />
      </InspectorField>

      {waveform && (
        <InspectorField label="WAVEFORM">
          <div className="flex gap-1">
            {(["sine", "triangle", "square", "sawtooth"] as const).map(
              (w) => (
                <button
                  key={w}
                  onClick={() => onWaveformChange(w)}
                  className="flex-1 px-2 py-1 text-xs rounded capitalize"
                  style={{
                    background:
                      waveform === w ? color : "#1a1a1a",
                    color:
                      waveform === w ? "#0d0d0d" : "#777",
                    border: `1px solid ${
                      waveform === w ? color : "#2a2a2a"
                    }`,
                    fontWeight: waveform === w ? 600 : 400,
                    fontSize: "10px",
                  }}
                >
                  {w}
                </button>
              )
            )}
          </div>
        </InspectorField>
      )}

      {adsr && (
        <InspectorField label="ADSR ENVELOPE">
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { key: "attack", label: "ATK" },
                { key: "decay", label: "DEC" },
                { key: "sustain", label: "SUS" },
                { key: "release", label: "REL" },
              ] as const
            ).map(({ key, label }) => (
              <div key={key} className="space-y-0.5">
                <label
                  className="text-xs"
                  style={{ color: "#444", fontSize: "9px" }}
                >
                  {label}
                </label>
                <input
                  type="number"
                  step={key === "sustain" ? 0.1 : 0.01}
                  min={key === "sustain" ? 0 : 0.001}
                  max={key === "sustain" ? 1 : undefined}
                  value={adsr[key]}
                  onChange={(e) =>
                    onAdsrChange({
                      ...adsr,
                      [key]: Number(e.target.value),
                    })
                  }
                  className="w-full p-1 text-xs rounded"
                  style={{
                    background: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    color: "#e8e8e8",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px",
                  }}
                />
              </div>
            ))}
          </div>
        </InspectorField>
      )}
    </div>
  );
}
