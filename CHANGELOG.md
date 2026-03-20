# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Hybrid LLM + algorithmic architecture**: LLM generates ONLY high-level CompositionSchema JSON, Python algorithms generate actual notes
- `core/scales.py`: 9 scale modes (major, minor, dorian, phrygian, mixolydian, harmonic_minor, pentatonic_major, pentatonic_minor, blues) with pitch math, MIDI conversion, scale snapping
- `core/contours.py`: 7 melodic contour shapes (arch, inverted_arch, ascending, descending, wave, staircase, plateau) mapping position to [0,1]
- `core/tension.py`: tension curve system with 6 style presets (cinematic, edm_drop, ballad, buildup, calm, dramatic) mapping tension to velocity, register, density, dissonance
- `core/motif.py`: 6 canonical transformations (inversion, retrograde, sequence, augmentation, diminution, fragmentation) with motif expansion
- `core/emotional_state.py`: 6 emotional states (calm, tense, climax, release, mysterious, triumphant) with linear blending between states
- `core/velocity_engine.py`: context-aware velocity assignment based on beat position, tension, chord tone status, phrase endings, with humanization
- `core/rhythm_templates.py`: 7 melody templates, 5 bass templates, 5 chord templates with density-controlled note placement
- `core/validator.py`: 4-criteria validation (scale adherence >80%, interval quality, pitch variety, register range)
- `models/composition_schema.py`: Pydantic schema for LLM output with DEFAULT_SCHEMA fallback
- `services/melody_generator.py`: orchestrator converting CompositionSchema into MusicScore with 3 channels (melody + bass + chords)

### Changed
- `composition_service.py`: LLM now generates 2KB structure JSON instead of 8KB note data, 3-retry loop with feedback, automatic fallback to DEFAULT_SCHEMA
- `core/prompts.py`: system prompt instructs LLM to output ONLY structure (motif_intervals, contour, tension_curve, emotional_arc, etc.) never individual notes
- Max tokens reduced from 8192 to 2048 for faster LLM responses
- Tone.js audio engine replacing raw Web Audio API oscillators: PolySynth, MonoSynth, FMSynth with professional effects chain (Reverb, EQ3, Compressor, Limiter)
- Duration selector in GlobalConfig (5s to 2min) passed to LLM for length-controlled compositions
- TopBar component with composition title, channel legend, loading spinner, error badge
- Sidebar component with clean tab navigation
- Full BEM CSS class system in globals.css replacing all inline styles
- Enhanced LLM system prompt with detailed music theory rules: octave ranges per channel, velocity dynamics, chord voicing, walking bass patterns, style-specific instructions (jazz, pop, classical, electronic, blues, rock, lo-fi)

### Changed
- GlobalConfig simplified from 9 individual onChange handlers to single onConfigChange(patch) pattern
- StudioConfig type defined once in GlobalConfig.types.ts (single source of truth)
- Bass preset redesigned: MonoSynth with fat sawtooth, filter envelope, sub-bass frequency, volume -2dB (loudest channel)
- NVIDIA API timeout increased from 30s to 120s in both settings.py and .env
- Waveform type extended with "sawtooth" across frontend types and backend Pydantic model
- PianoRoll wheel handler switched from React onWheel to native addEventListener with passive: false

### Fixed
- NVIDIA API timeout of 30 seconds causing 500 errors on complex compositions (.env was overriding settings.py default)
- preventDefault warning on passive wheel event listener in PianoRoll canvas

### Added
- FL Studio-style graphical piano keyboard on the left side of the piano roll, with realistic white/black key rendering and mouse press-to-play sound
- 8 instrument presets in audio engine: Piano, Electric Piano, Synth Pad, Strings, Organ, Pluck, Bass Synth, Bell, each with multi-oscillator FM synthesis, filter sweeps, and convolution reverb
- Instrument selector dropdown in transport bar to switch presets for piano keys and playback
- Auto-scroll playhead into view during playback
- Channel-aware preset routing: bass channel uses bass_synth preset, chords channel uses synth_pad preset automatically
- Bar/Beat position counter in transport bar alongside time display
- Dark theme UI inspired by FL Studio with custom CSS variables, styled scrollbars, and orange/green/blue accent palette
- Piano roll always visible (even without composition) so users can play keys before generating music
- Server MCP in Python with `mcp` SDK, replacing previous Node.js implementation

### Fixed
- Duplicated `/v1` in NVIDIA API URL path: base_url ended with `/v1` and request path started with `/v1/chat/completions`, resulting in 404 from NVIDIA API
- Broken `.venv` pointing to wrong user path, recreated virtual environment with local Python 3.12
- `structlog` crash in `api_server.py` caused by referencing non-existent `structlog.INFO` attribute, replaced with `logging.INFO` from stdlib
- Missing `message` property on `MusicMcpError` base class referenced by `server.py` error handler
- Unused PostgreSQL-specific import (`sqlalchemy.dialects.postgresql.UUID`) in SQLite-based `models/db.py`
- Studio page placed in Pages Router path (`src/pages/studio/`) instead of App Router path (`src/app/`), moved to correct location
- Circular import in API route that imported `compositionService` which itself called the same route, rewrote to proxy directly to Python backend
- Wrong return types in `compositionService.ts` (`generateMelody` and `generateRhythm` incorrectly typed as `Composition`)
- Conflicting `next.config.js` rewrite that was shadowed by the API route handler at the same path
- Fragile relative import paths in hooks and component types, replaced with `@/` path alias
- Async `NvidiaClient` using `httpx` for NVIDIA Build API communication
- `CompositionService` with parallel melody and rhythm generation via `asyncio.gather`
- Polyphonic `MusicScore` schema with `channels[]`, each channel having independent `waveform` and `adsr`
- Pydantic v2 validation on all model responses before returning to client
- Custom exception hierarchy: `NvidiaApiError`, `NvidiaTimeoutError`, `InvalidModelResponseError`
- Configuration via Pydantic Settings with explicit crash on missing `NVIDIA_API_KEY`
- Separate system prompts `MELODY_SYSTEM` and `RHYTHM_SYSTEM` in `core/prompts.py`
- `json_parser.py` utility to strip markdown fences from model responses
- Structured JSON logging with `structlog` to stderr
- SQLite database for session persistence with CRUD operations
- React + TypeScript frontend with Next.js App Router
- `useAudioEngine` hook for polyphonic audio with per-channel ADSR envelopes
- `useComposition`, `usePlayback`, `useNoteSelection`, `useChatHistory` hooks
- `PianoRoll` component with canvas rendering, grid, notes, and playhead
- `ChatPanel` component for text input and message history
- `NoteInspector` component for editing selected note properties
- `TransportBar` component for playback controls and time display
- `GlobalConfig` component for composition parameters
- Next.js API route `/api/v1/mcp/[tool]` as bridge to Python backend
- TypeScript types in `music.ts` aligned 1:1 with Pydantic models
- Session management with localStorage persistence and database backup

### Removed
- Server MCP Node.js implementation using `@modelcontextprotocol/sdk`
- Monolithic `player.html` vanilla JavaScript implementation
- Flat note arrays without channel separation

## [1.0.0] - 2024-01-15

### Added
- Initial proof of concept with basic melody generation
- Simple Web Audio API playback
- Text prompt to MIDI-like note output
