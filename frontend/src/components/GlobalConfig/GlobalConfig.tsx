import {
  GlobalConfigProps,
  MUSICAL_KEYS,
  DURATION_OPTIONS,
  StudioConfig,
} from "./GlobalConfig.types";

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="config-section">
      <label className="config-label">{label}</label>
      {children}
    </div>
  );
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="toggle-group">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`toggle-btn ${
            value === opt.value ? "active" : ""
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function GlobalConfig({
  config,
  onConfigChange,
}: GlobalConfigProps) {
  const update = (
    patch: Partial<StudioConfig>
  ) => onConfigChange(patch);

  return (
    <div className="config-panel">
      <Section label="DURATA">
        <div className="toggle-group">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() =>
                update({
                  durationSeconds: opt.value,
                })
              }
              className={`toggle-btn ${
                config.durationSeconds === opt.value
                  ? "active"
                  : ""
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      <Section label="BPM">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={40}
            max={240}
            value={config.bpm}
            onChange={(e) =>
              update({ bpm: Number(e.target.value) })
            }
            className="flex-1"
          />
          <span className="config-value">
            {config.bpm}
          </span>
        </div>
      </Section>

      <Section label="TONALITA">
        <select
          value={config.key}
          onChange={(e) =>
            update({ key: e.target.value })
          }
          className="config-select"
        >
          {MUSICAL_KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </Section>

      <Section label="METRICA">
        <ToggleGroup
          options={[
            { value: "4/4", label: "4/4" },
            { value: "3/4", label: "3/4" },
            { value: "6/8", label: "6/8" },
          ]}
          value={config.timeSignature}
          onChange={(ts) =>
            update({ timeSignature: ts })
          }
        />
      </Section>

      <Section label="MODELLO">
        <input
          type="text"
          value={config.model}
          onChange={(e) =>
            update({ model: e.target.value })
          }
          className="config-input mono"
          placeholder="meta/llama-3.1-70b-instruct"
        />
      </Section>

      <Section
        label={`TEMPERATURE  ${config.temperature}`}
      >
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={config.temperature}
          onChange={(e) =>
            update({
              temperature: Number(e.target.value),
            })
          }
          className="w-full"
        />
      </Section>

      <Section label={`TOP P  ${config.topP}`}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={config.topP}
          onChange={(e) =>
            update({
              topP: Number(e.target.value),
            })
          }
          className="w-full"
        />
      </Section>

      <Section label="GENERA">
        <ToggleGroup
          options={[
            { value: "melody", label: "Melodia" },
            { value: "rhythm", label: "Ritmo" },
            { value: "both", label: "Full" },
          ]}
          value={config.generateMode}
          onChange={(mode) =>
            update({ generateMode: mode })
          }
        />
      </Section>

      <Section label="QUANTIZZAZIONE">
        <ToggleGroup
          options={[
            { value: "1/4", label: "1/4" },
            { value: "1/8", label: "1/8" },
            { value: "1/16", label: "1/16" },
            { value: "free", label: "Free" },
          ]}
          value={config.quantization}
          onChange={(q) =>
            update({ quantization: q })
          }
        />
      </Section>
    </div>
  );
}
