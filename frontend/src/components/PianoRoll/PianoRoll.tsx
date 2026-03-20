import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  PianoRollProps,
  TOTAL_KEYS,
  isBlackKey,
  noteToRow,
  rowToNote,
} from "./PianoRoll.types";

const ROW_HEIGHT = 20;
const WHITE_KEY_WIDTH = 110;
const BLACK_KEY_WIDTH = 70;
const KEY_AREA_WIDTH = 115;
const PIXELS_PER_BEAT = 48;
const HEADER_HEIGHT = 24;

const CHANNEL_COLORS: Record<string, string> = {
  melody: "#f0883e",
  bass: "#4ade80",
  chords: "#60a5fa",
};

const CHANNEL_COLORS_DARK: Record<string, string> = {
  melody: "#c06a2e",
  bass: "#38b868",
  chords: "#4a8ad8",
};

/* ─── Piano keys (HTML overlay) ─── */

function PianoKeys({
  scrollY,
  viewHeight,
  onKeyDown,
  onKeyUp,
  pressedKeys,
}: {
  scrollY: number;
  viewHeight: number;
  onKeyDown: (pitch: string, octave: number) => void;
  onKeyUp: (pitch: string, octave: number) => void;
  pressedKeys: Set<string>;
}) {
  const keys: {
    row: number;
    pitch: string;
    octave: number;
    black: boolean;
  }[] = [];

  for (let r = 0; r < TOTAL_KEYS; r++) {
    const { pitch, octave } = rowToNote(r);
    keys.push({
      row: r,
      pitch,
      octave,
      black: isBlackKey(pitch),
    });
  }

  const whiteKeys = keys.filter((k) => !k.black);
  const blackKeys = keys.filter((k) => k.black);

  return (
    <div
      className="absolute left-0 overflow-hidden"
      style={{
        top: HEADER_HEIGHT,
        width: KEY_AREA_WIDTH,
        height: viewHeight - HEADER_HEIGHT,
        zIndex: 20,
      }}
    >
      {/* White keys */}
      {whiteKeys.map((k) => {
        const y = k.row * ROW_HEIGHT - scrollY;
        const keyId = `${k.pitch}${k.octave}`;
        const pressed = pressedKeys.has(keyId);
        const isCNote = k.pitch === "C";

        if (y + ROW_HEIGHT < 0 || y > viewHeight) return null;

        return (
          <div
            key={keyId}
            onMouseDown={(e) => {
              e.preventDefault();
              onKeyDown(k.pitch, k.octave);
            }}
            onMouseUp={() => onKeyUp(k.pitch, k.octave)}
            onMouseLeave={() => {
              if (pressed) onKeyUp(k.pitch, k.octave);
            }}
            className="absolute select-none"
            style={{
              left: 0,
              top: y,
              width: WHITE_KEY_WIDTH,
              height: ROW_HEIGHT - 1,
              background: pressed
                ? "linear-gradient(180deg, #bbb 0%, #ddd 100%)"
                : "linear-gradient(180deg, #e0e0e0 0%, #f5f5f5 100%)",
              borderBottom: "1px solid #888",
              borderRight: "2px solid #555",
              borderRadius: "0 3px 3px 0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: 6,
              fontSize: isCNote ? 10 : 9,
              fontWeight: isCNote ? 700 : 400,
              color: isCNote ? "#333" : "#888",
              fontFamily: "'Inter', sans-serif",
              boxShadow: pressed
                ? "inset 0 1px 3px rgba(0,0,0,0.3)"
                : "inset 0 -1px 0 rgba(0,0,0,0.08)",
              transition: "background 0.05s",
            }}
          >
            {keyId}
          </div>
        );
      })}

      {/* Black keys on top */}
      {blackKeys.map((k) => {
        const y = k.row * ROW_HEIGHT - scrollY;
        const keyId = `${k.pitch}${k.octave}`;
        const pressed = pressedKeys.has(keyId);

        if (y + ROW_HEIGHT < 0 || y > viewHeight) return null;

        return (
          <div
            key={keyId}
            onMouseDown={(e) => {
              e.preventDefault();
              onKeyDown(k.pitch, k.octave);
            }}
            onMouseUp={() => onKeyUp(k.pitch, k.octave)}
            onMouseLeave={() => {
              if (pressed) onKeyUp(k.pitch, k.octave);
            }}
            className="absolute select-none"
            style={{
              left: 0,
              top: y,
              width: BLACK_KEY_WIDTH,
              height: ROW_HEIGHT - 1,
              background: pressed
                ? "linear-gradient(180deg, #444 0%, #555 100%)"
                : "linear-gradient(180deg, #1a1a1a 0%, #333 100%)",
              borderBottom: "1px solid #000",
              borderRight: "2px solid #000",
              borderRadius: "0 3px 3px 0",
              cursor: "pointer",
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: 4,
              fontSize: 8,
              color: pressed ? "#ccc" : "#777",
              fontFamily: "'Inter', sans-serif",
              boxShadow: pressed
                ? "inset 0 1px 3px rgba(0,0,0,0.6)"
                : "1px 1px 2px rgba(0,0,0,0.4)",
              transition: "background 0.05s",
            }}
          >
            {keyId}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Canvas rendering functions ─── */

function renderHeader(
  ctx: CanvasRenderingContext2D,
  width: number,
  totalBeats: number,
  scrollX: number
) {
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, width, HEADER_HEIGHT);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, HEADER_HEIGHT - 0.5);
  ctx.lineTo(width, HEADER_HEIGHT - 0.5);
  ctx.stroke();

  const beatsPerBar = 4;
  ctx.font = "600 10px 'Inter', sans-serif";

  for (let beat = 0; beat <= totalBeats; beat++) {
    const x =
      KEY_AREA_WIDTH + beat * PIXELS_PER_BEAT - scrollX;
    if (x < KEY_AREA_WIDTH - 30 || x > width + 30) continue;

    if (beat % beatsPerBar === 0) {
      const bar = Math.floor(beat / beatsPerBar) + 1;
      ctx.fillStyle = "#888";
      ctx.fillText(`${bar}`, x + 4, 15);

      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 18);
      ctx.lineTo(x + 0.5, HEADER_HEIGHT);
      ctx.stroke();
    }
  }

  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, KEY_AREA_WIDTH, HEADER_HEIGHT);
}

function renderGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  totalBeats: number,
  scrollX: number,
  scrollY: number
) {
  for (let r = 0; r < TOTAL_KEYS; r++) {
    const y = HEADER_HEIGHT + r * ROW_HEIGHT - scrollY;
    if (y + ROW_HEIGHT < HEADER_HEIGHT || y > height) continue;

    const { pitch } = rowToNote(r);
    const black = isBlackKey(pitch);

    ctx.fillStyle = black
      ? "rgba(0, 0, 0, 0.18)"
      : "rgba(255, 255, 255, 0.015)";
    ctx.fillRect(
      KEY_AREA_WIDTH,
      y,
      width - KEY_AREA_WIDTH,
      ROW_HEIGHT
    );

    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(KEY_AREA_WIDTH, y + ROW_HEIGHT - 0.5);
    ctx.lineTo(width, y + ROW_HEIGHT - 0.5);
    ctx.stroke();

    if (pitch === "C") {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(KEY_AREA_WIDTH, y + ROW_HEIGHT - 0.5);
      ctx.lineTo(width, y + ROW_HEIGHT - 0.5);
      ctx.stroke();
    }
  }

  const beatsPerBar = 4;
  for (let beat = 0; beat <= totalBeats; beat++) {
    const x =
      KEY_AREA_WIDTH + beat * PIXELS_PER_BEAT - scrollX;
    if (x < KEY_AREA_WIDTH || x > width) continue;

    const isBar = beat % beatsPerBar === 0;
    ctx.strokeStyle = isBar
      ? "rgba(255,255,255,0.12)"
      : "rgba(255,255,255,0.04)";
    ctx.lineWidth = isBar ? 1 : 0.5;

    ctx.beginPath();
    ctx.moveTo(x + 0.5, HEADER_HEIGHT);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }
}

function renderNotes(
  ctx: CanvasRenderingContext2D,
  channels: PianoRollProps["channels"],
  scrollX: number,
  scrollY: number,
  width: number,
  height: number,
  selectedChannelId?: string | null,
  selectedNoteIndex?: number | null
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(
    KEY_AREA_WIDTH,
    HEADER_HEIGHT,
    width - KEY_AREA_WIDTH,
    height - HEADER_HEIGHT
  );
  ctx.clip();

  channels.forEach((channel) => {
    const color = CHANNEL_COLORS[channel.id] || "#888";
    const colorDark =
      CHANNEL_COLORS_DARK[channel.id] || "#666";

    channel.notes.forEach((note, noteIndex) => {
      const row = noteToRow(note.pitch, note.octave);
      const x =
        KEY_AREA_WIDTH +
        note.start_time * PIXELS_PER_BEAT -
        scrollX;
      const y = HEADER_HEIGHT + row * ROW_HEIGHT - scrollY;
      const w = Math.max(
        note.duration * PIXELS_PER_BEAT,
        8
      );
      const h = ROW_HEIGHT - 2;
      const ny = y + 1;

      if (
        x + w < KEY_AREA_WIDTH ||
        x > width ||
        ny + h < HEADER_HEIGHT ||
        ny > height
      ) {
        return;
      }

      const velocity = note.velocity / 127;
      const isSelected =
        selectedChannelId === channel.id &&
        selectedNoteIndex === noteIndex;

      const alpha = 0.5 + velocity * 0.5;
      ctx.globalAlpha = alpha;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, ny, w, h, 2);
      ctx.fill();

      ctx.fillStyle = colorDark;
      ctx.fillRect(x, ny, 3, h);

      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#fff";
      ctx.fillRect(x, ny, w, 1);

      if (isSelected) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, ny, w, h, 2);
        ctx.stroke();

        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x - 1, ny - 1, w + 2, h + 2, 3);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      if (w > 24) {
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = "#000";
        ctx.font = "600 9px 'Inter', sans-serif";
        ctx.fillText(
          `${note.pitch}${note.octave}`,
          x + 5,
          ny + h / 2 + 3
        );
      }

      ctx.globalAlpha = 1;
    });
  });

  ctx.restore();
}

function renderPlayhead(
  ctx: CanvasRenderingContext2D,
  time: number,
  height: number,
  scrollX: number,
  bpm: number
) {
  const beatDuration = 60 / bpm;
  const beatPosition = time / beatDuration;
  const x =
    KEY_AREA_WIDTH + beatPosition * PIXELS_PER_BEAT - scrollX;

  if (x < KEY_AREA_WIDTH || x > ctx.canvas.width) return;

  ctx.save();
  ctx.shadowColor = "#f0883e";
  ctx.shadowBlur = 8;
  ctx.strokeStyle = "#f0883e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.fillStyle = "#f0883e";
  ctx.beginPath();
  ctx.moveTo(x - 6, 0);
  ctx.lineTo(x + 6, 0);
  ctx.lineTo(x, 10);
  ctx.closePath();
  ctx.fill();
}

/* ─── Main component ─── */

export function PianoRoll({
  channels,
  bpm,
  playheadTime,
  onNoteClick,
  onKeyDown,
  onKeyUp,
  selectedChannelId,
  selectedNoteIndex,
}: PianoRollProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(
    new Set()
  );
  const [dimensions, setDimensions] = useState({
    width: 800,
    height: 600,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const totalBeats = Math.max(
    ...channels.flatMap((ch) =>
      ch.notes.map((n) => n.start_time + n.duration)
    ),
    32
  );

  const totalGridWidth = totalBeats * PIXELS_PER_BEAT;
  const totalGridHeight = TOTAL_KEYS * ROW_HEIGHT;
  const maxScrollX = Math.max(
    0,
    totalGridWidth - (dimensions.width - KEY_AREA_WIDTH)
  );
  const maxScrollY = Math.max(
    0,
    totalGridHeight - (dimensions.height - HEADER_HEIGHT)
  );

  // Auto-scroll playhead into view
  useEffect(() => {
    if (playheadTime <= 0) return;
    const beatDuration = 60 / bpm;
    const beatPos = playheadTime / beatDuration;
    const playheadX = beatPos * PIXELS_PER_BEAT;
    const viewWidth = dimensions.width - KEY_AREA_WIDTH;
    const margin = viewWidth * 0.8;

    if (playheadX - scrollX > margin) {
      setScrollX(
        Math.min(playheadX - viewWidth * 0.2, maxScrollX)
      );
    }
  }, [playheadTime, bpm, dimensions.width, maxScrollX]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#111";
    ctx.fillRect(
      0,
      0,
      dimensions.width,
      dimensions.height
    );

    renderGrid(
      ctx,
      dimensions.width,
      dimensions.height,
      totalBeats,
      scrollX,
      scrollY
    );
    renderNotes(
      ctx,
      channels,
      scrollX,
      scrollY,
      dimensions.width,
      dimensions.height,
      selectedChannelId,
      selectedNoteIndex
    );
    renderPlayhead(
      ctx,
      playheadTime,
      dimensions.height,
      scrollX,
      bpm
    );
    renderHeader(
      ctx,
      dimensions.width,
      totalBeats,
      scrollX
    );

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, HEADER_HEIGHT, KEY_AREA_WIDTH, dimensions.height);
  }, [
    channels,
    playheadTime,
    scrollX,
    scrollY,
    dimensions,
    bpm,
    totalBeats,
    selectedChannelId,
    selectedNoteIndex,
  ]);

  // Native wheel handler to avoid passive event listener issue
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.shiftKey) {
        setScrollX((prev) =>
          Math.max(
            0,
            Math.min(prev + e.deltaY, maxScrollX)
          )
        );
      } else {
        setScrollY((prev) =>
          Math.max(
            0,
            Math.min(prev + e.deltaY, maxScrollY)
          )
        );
      }
    };

    canvas.addEventListener("wheel", onWheel, {
      passive: false,
    });
    return () =>
      canvas.removeEventListener("wheel", onWheel);
  }, [maxScrollX, maxScrollY]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      if (
        clickX < KEY_AREA_WIDTH ||
        clickY < HEADER_HEIGHT
      )
        return;

      const gridX = clickX - KEY_AREA_WIDTH + scrollX;
      const gridY = clickY - HEADER_HEIGHT + scrollY;

      const clickBeat = gridX / PIXELS_PER_BEAT;
      const clickRow = Math.floor(gridY / ROW_HEIGHT);

      channels.forEach((channel) => {
        channel.notes.forEach((note, noteIndex) => {
          const row = noteToRow(note.pitch, note.octave);
          if (
            row === clickRow &&
            clickBeat >= note.start_time &&
            clickBeat <= note.start_time + note.duration
          ) {
            onNoteClick(channel.id, noteIndex);
          }
        });
      });
    },
    [channels, onNoteClick, scrollX, scrollY]
  );

  const handlePianoKeyDown = useCallback(
    (pitch: string, octave: number) => {
      const key = `${pitch}${octave}`;
      setPressedKeys((prev) => new Set(prev).add(key));
      onKeyDown(pitch, octave);
    },
    [onKeyDown]
  );

  const handlePianoKeyUp = useCallback(
    (pitch: string, octave: number) => {
      const key = `${pitch}${octave}`;
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      onKeyUp(pitch, octave);
    },
    [onKeyUp]
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      style={{ background: "#111" }}
    >
      {/* Canvas: grid + notes + playhead */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}

        className="cursor-crosshair block"
      />

      {/* Piano keys overlay */}
      <PianoKeys
        scrollY={scrollY}
        viewHeight={dimensions.height}
        onKeyDown={handlePianoKeyDown}
        onKeyUp={handlePianoKeyUp}
        pressedKeys={pressedKeys}
      />

      {/* Vertical scrollbar */}
      {maxScrollY > 0 && (
        <div
          className="absolute right-0 w-[6px]"
          style={{
            top: HEADER_HEIGHT,
            bottom: 0,
            background: "rgba(0,0,0,0.3)",
          }}
        >
          <div
            className="absolute w-full rounded-full"
            style={{
              background: "rgba(255,255,255,0.15)",
              height: `${Math.max(
                20,
                ((dimensions.height - HEADER_HEIGHT) /
                  totalGridHeight) *
                  (dimensions.height - HEADER_HEIGHT)
              )}px`,
              top: `${
                (scrollY / maxScrollY) *
                (dimensions.height -
                  HEADER_HEIGHT -
                  Math.max(
                    20,
                    ((dimensions.height - HEADER_HEIGHT) /
                      totalGridHeight) *
                      (dimensions.height - HEADER_HEIGHT)
                  ))
              }px`,
            }}
          />
        </div>
      )}

      {/* Horizontal scrollbar */}
      {maxScrollX > 0 && (
        <div
          className="absolute bottom-0 h-[6px]"
          style={{
            left: KEY_AREA_WIDTH,
            right: 0,
            background: "rgba(0,0,0,0.3)",
            cursor: "pointer",
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            const track = e.currentTarget;
            const trackRect = track.getBoundingClientRect();
            const trackWidth = trackRect.width;

            const setScrollFromX = (clientX: number) => {
              const relX = clientX - trackRect.left;
              const ratio = Math.max(0, Math.min(1, relX / trackWidth));
              setScrollX(ratio * maxScrollX);
            };

            setScrollFromX(e.clientX);

            const onMove = (ev: MouseEvent) => {
              setScrollFromX(ev.clientX);
            };
            const onUp = () => {
              window.removeEventListener("mousemove", onMove);
              window.removeEventListener("mouseup", onUp);
            };
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
        >
          <div
            className="absolute h-full rounded-full"
            style={{
              background: "rgba(255,255,255,0.25)",
              width: `${Math.max(
                20,
                ((dimensions.width - KEY_AREA_WIDTH) /
                  totalGridWidth) *
                  (dimensions.width - KEY_AREA_WIDTH)
              )}px`,
              left: `${
                (scrollX / maxScrollX) *
                (dimensions.width -
                  KEY_AREA_WIDTH -
                  Math.max(
                    20,
                    ((dimensions.width - KEY_AREA_WIDTH) /
                      totalGridWidth) *
                      (dimensions.width - KEY_AREA_WIDTH)
                  ))
              }px`,
            }}
          />
        </div>
      )}
    </div>
  );
}
