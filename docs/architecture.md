# Music MCP Studio Architecture

## System Overview

Music MCP Studio converts text prompts into polyphonic piano compositions. The system follows a client-server architecture with clear separation between the AI-powered backend and the interactive frontend.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              User Interface                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ChatPanel    │  │ PianoRoll    │  │ NoteInspector│  │ TransportBar │      │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                                              │
│  React + TypeScript + Next.js + Tailwind CSS                               │
│                                                                              │
│  Hooks: useAudioEngine, useComposition, usePlayback,                         │
│         useNoteSelection, useChatHistory                                     │
└──────────────────────┬───────────────────────────────────────────────────────┘
                       │ HTTP POST /api/v1/mcp/{tool}
                       │
┌──────────────────────▼───────────────────────────────────────────────────────┐
│                              API Bridge                                      │
│                                                                              │
│  Next.js Route Handler (app/api/v1/mcp/[tool]/route.ts)                      │
│  ├─ Validates tool name                                                      │
│  ├─ Extracts prompt and model from body                                      │
│  └─ Forwards to Python HTTP server (localhost:8001)                         │
└──────────────────────┬───────────────────────────────────────────────────────┘
                       │ HTTP POST /v1/{tool}
                       │
┌──────────────────────▼───────────────────────────────────────────────────────┐
│                         MCP Server (Python)                                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  Server (mcp.server.Server)                                             │ │
│  │  ├─ list_tools()                                                        │ │
│  │  └─ call_tool() ──▶ CompositionService                                 │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ NvidiaClient    │  │ CompositionSvc  │  │ Database        │             │
│  │ (httpx async)   │  │ (parallel gen)  │  │ (SQLite)        │             │
│  └────────┬────────┘  └─────────────────┘  └─────────────────┘             │
│           │                                                                  │
│           └──────────────────▶ NVIDIA Build API                             │
│                                 /v1/chat/completions                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Backend Components

### MCP Server (`server.py`)

Entry point implementing the Model Context Protocol. Manages tool registration and JSON-RPC communication over stdio.

**Key responsibilities:**
- Initialize settings and validate environment
- Configure structured JSON logging
- Register MCP tools with schemas
- Route tool calls to CompositionService
- Handle errors and return TextContent responses

### NvidiaClient (`services/nvidia_client.py`)

Async HTTP client for NVIDIA Build API.

**Key features:**
- Uses `httpx.AsyncClient` with HTTP/2
- Configurable timeout from settings
- Bearer token authentication
- Structured logging (no message content)
- Custom exceptions: `NvidiaApiError`, `NvidiaTimeoutError`

### CompositionService (`services/composition_service.py`)

Orchestrates melody and rhythm generation.

**Key features:**
- Parallel generation via `asyncio.gather()`
- Separate system prompts for melody and rhythm
- JSON parsing and Pydantic validation
- Structured result logging

### Database (`db/database.py`)

SQLite persistence layer for sessions.

**Schema:**
```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    composition TEXT NOT NULL,  -- JSON serialized
    messages TEXT NOT NULL      -- JSON serialized
);
```

**Operations:**
- `save_session()` - Insert or update
- `get_session()` - Retrieve by ID
- `list_sessions()` - List with pagination
- `delete_session()` - Remove by ID

### Data Models (`models/music.py`)

Pydantic v2 models with strict validation.

**Core types:**
- `Note` - Pitch (A-G with #/b), octave 2-7, timing, velocity 1-127
- `Channel` - Role (melody/bass/chords), waveform, ADSR, note list
- `MusicScore` - Title, BPM 40-240, key, time signature, channels
- `RhythmBeat` - Beat position, duration, accent, type
- `RhythmScore` - BPM, time signature, bars, pattern
- `Composition` - Melody + Rhythm

## Frontend Components

### Hooks

#### useAudioEngine

Manages Web Audio API context and polyphonic scheduling.

```typescript
interface AudioEngine {
  scheduleChannels: (channels: Channel[], bpm: number) => void;
  stop: () => void;
  currentTime: () => number;
}
```

**ADSR Implementation:**
- Attack: Linear ramp to velocity over attack time
- Decay: Exponential ramp to sustain level
- Sustain: Hold level until release
- Release: Linear ramp to zero

#### useComposition

State management for composition generation.

```typescript
interface CompositionState {
  composition: Composition | null;
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, model?: string) => Promise<Composition | null>;
  clear: () => void;
}
```

#### usePlayback

Coordinates audio scheduling with visual playhead.

```typescript
interface PlaybackState {
  isPlaying: boolean;
  elapsed: number;
  play: (channels: Channel[], bpm: number) => void;
  stop: () => void;
  rewind: () => void;
}
```

#### useNoteSelection

Manages note selection and editing.

```typescript
interface NoteSelection {
  selected: { channelId: ChannelRole; noteIndex: number } | null;
  selectNote: (channelId: ChannelRole, noteIndex: number) => void;
  clearSelection: () => void;
  selectedNote: (composition: MusicScore) => Note | null;
  updateNote: (composition: MusicScore, patch: Partial<Note>) => MusicScore | null;
}
```

#### useChatHistory

Manages chat messages and session persistence.

```typescript
interface ChatHistory {
  messages: ChatMessage[];
  sessions: Session[];
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string) => void;
  saveSession: (title: string, composition: Composition | null) => string;
  loadSession: (id: string) => { composition: Composition | null; messages: ChatMessage[] } | null;
}
```

### Components

#### PianoRoll

Canvas-based visualization of channels and notes.

**Rendering:**
- Grid with time markers (1-second intervals)
- Channel rows with color coding:
  - Melody: #534AB7 (indigo)
  - Bass: #1D9E75 (green)
  - Chords: #BA7517 (amber)
- Note opacity based on velocity
- Red playhead line at current time
- Click detection for note selection

**Constants:**
- `PIXELS_PER_SECOND = 100`
- `ROW_HEIGHT = 24`
- `KEY_WIDTH = 60`

#### ChatPanel

Message history with auto-scroll.

**Features:**
- User messages: Right-aligned, indigo background
- Assistant messages: Left-aligned, bordered
- Loading indicator: Three-dot animation
- Input: Multi-line textarea with Enter to send

#### NoteInspector

Property editor for selected notes.

**Controls:**
- 12-button chromatic keyboard for pitch
- Octave selector with +/- buttons
- Sliders for velocity, duration, start_time
- Waveform selector (sine/triangle/square)
- ADSR numeric inputs

#### TransportBar

Playback controls and display.

**Features:**
- Rewind, Play/Stop buttons
- BPM input (40-240)
- Time display: `m:ss.d` format

#### GlobalConfig

Side panel for composition parameters.

**Settings:**
- BPM slider
- Key selector (24 options)
- Time signature buttons
- Model input
- Temperature slider (0-1)
- Top P slider (0-1)
- Generate mode (melody/rhythm/both)
- Quantization (1/4, 1/8, 1/16, free)

## Data Flow

### Generation Flow

```
1. User submits prompt in ChatPanel
2. useChatHistory.addUserMessage()
3. useComposition.generate()
4. compositionService.generateComposition()
5. POST /api/v1/mcp/generate_composition
6. Python service calls NVIDIA API twice (parallel)
7. JSON parsed and validated by Pydantic
8. Result returned to frontend
9. PianoRoll redraws with new channels
10. useChatHistory.addAssistantMessage()
11. Session saved to database + localStorage
```

### Playback Flow

```
1. User clicks Play in TransportBar
2. usePlayback.play(channels, bpm)
3. useAudioEngine.scheduleChannels()
4. For each channel:
   a. Create OscillatorNode with channel waveform
   b. Create GainNode with ADSR curves
   c. Schedule start/stop times
   d. Connect to destination
5. Start requestAnimationFrame loop
6. Update elapsed time each frame
7. Redraw playhead position
8. Auto-stop at composition end
```

### Note Editing Flow

```
1. User clicks note in PianoRoll
2. onNoteClick callback fired
3. useNoteSelection.selectNote()
4. NoteInspector displays properties
5. User modifies value
6. updateNote() creates new MusicScore
7. useComposition.updateComposition()
8. React re-renders PianoRoll
9. Changes reflected immediately
```

## Configuration

### Environment Variables

**Backend (.env):**
```
NVIDIA_API_KEY=nvapi-xxxxx
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_DEFAULT_MODEL=meta/llama-3.1-70b-instruct
NVIDIA_TIMEOUT_SECONDS=30
MCP_SERVER_NAME=music-mcp
MCP_SERVER_VERSION=2.0.0
LOG_LEVEL=INFO
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Security Considerations

1. **API Keys:** Never committed to repository
2. **CORS:** Configured at framework level
3. **Input Validation:** All inputs validated at boundaries
4. **SQL Injection:** Parameterized queries only
5. **XSS:** React escapes HTML by default

## Performance Optimizations

1. **Parallel Generation:** Melody and rhythm generated simultaneously
2. **Canvas Rendering:** GPU-accelerated 2D context
3. **Request Deduplication:** No duplicate in-flight requests
4. **Debounced Updates:** Note editing batched where applicable
5. **Lazy Loading:** Components loaded on demand

## Testing Strategy

**Backend:**
- Unit tests for JSON parsing
- Unit tests for model validation
- Integration tests for service layer
- Mock NVIDIA API responses

**Frontend:**
- Component tests with React Testing Library
- Hook tests with custom renderers
- E2E tests for critical paths

## Deployment

**Development:**
```bash
# Backend
cd backend
uv run music-mcp

# Frontend
cd frontend
npm run dev
```

**Production:**
- Backend: Docker container with Python 3.11
- Frontend: Static export via `next build && next export`
- Database: SQLite volume mount
