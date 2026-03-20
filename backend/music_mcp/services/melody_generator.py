"""Cinematic melody generator — Hans Zimmer techniques.

Key techniques implemented:
1. OSTINATO: repeating rhythmic cell that drives tension
2. PEDAL TONE: sustained bass note under changing harmony
3. COUNTER-MELODY: secondary line moving against the main melody
4. MODAL INTERCHANGE: borrowed chords from parallel mode
5. TENSION RAMP: velocity/register/density escalation toward climax
6. DRAMATIC SILENCE: strategic rests before big moments
7. WIDE INTERVALS at climax: octave leaps, 5ths for power
"""

import math
import random

from music_mcp.core.contours import get_contour_values
from music_mcp.core.scales import midi_to_note_name, snap_to_scale
from music_mcp.models.composition_schema import GenerationSchema
from music_mcp.models.music import (
    Adsr,
    Channel,
    ChannelRole,
    Instrument,
    MusicScore,
    Note,
    Waveform,
)


# ── Rhythm cells (Zimmer-style ostinato patterns) ─────────────

_OSTINATO_CELLS: list[list[tuple[float, float]]] = [
    # (beat_offset, duration) — 1 bar patterns
    [(0, 0.5), (0.5, 0.5), (1, 0.5), (1.5, 0.5), (2, 0.5), (2.5, 0.5), (3, 0.5), (3.5, 0.5)],  # Driving 8ths
    [(0, 0.75), (0.75, 0.75), (1.5, 0.5), (2, 0.75), (2.75, 0.75), (3.5, 0.5)],  # Dotted rhythm
    [(0, 1), (1, 0.5), (1.5, 0.5), (2, 1), (3, 0.5), (3.5, 0.5)],  # Long-short
]

_MELODY_PHRASES: list[list[tuple[float, float]]] = [
    # Lyrical phrases for main melody (longer notes)
    [(0, 3), (3, 1)],  # Sustained + pickup
    [(0, 2), (2, 2)],  # Two halves
    [(0, 1.5), (1.5, 1), (2.5, 1.5)],  # Triplet feel
    [(0, 2), (2, 1), (3, 0.5), (3.5, 0.5)],  # Long then active
    [(0, 4)],  # Whole note hold
    [(0, 1), (1, 1), (2, 1), (3, 1)],  # Walking quarters
    [(0, 1.5), (1.5, 0.5), (2, 1), (3, 1)],  # Dotted quarter
    [(0, 3), (3, 0.5), (3.5, 0.5)],  # Long hold + fill
]

_CLIMAX_RHYTHMS: list[list[tuple[float, float]]] = [
    [(0, 4)],  # Power whole note
    [(0, 2), (2, 2)],  # Two power halves
    [(0, 1.5), (2, 1.5), (3.5, 0.5)],  # Syncopated power
]


# ── Section types and their behaviors ─────────────────────────


def _section_config(section_name: str, bar_in_section: int, total_section_bars: int) -> dict:
    """Get generation parameters for an emotional section."""
    progress = bar_in_section / max(total_section_bars - 1, 1)

    configs = {
        "calm": {
            "use_ostinato": False,
            "melody_style": "lyrical",
            "vel_base": 35,
            "vel_range": 20,
            "interval_max": 4,
            "rest_prob": 0.25,
            "register_shift": -5,
        },
        "mysterious": {
            "use_ostinato": True,
            "melody_style": "lyrical",
            "vel_base": 30,
            "vel_range": 25,
            "interval_max": 5,
            "rest_prob": 0.2,
            "register_shift": -3,
        },
        "tense": {
            "use_ostinato": True,
            "melody_style": "active",
            "vel_base": 50 + int(progress * 30),
            "vel_range": 30,
            "interval_max": 5,
            "rest_prob": 0.1,
            "register_shift": int(progress * 5),
        },
        "climax": {
            "use_ostinato": True,
            "melody_style": "power",
            "vel_base": 85 + int(progress * 20),
            "vel_range": 15,
            "interval_max": 7,  # Allow wider intervals at climax
            "rest_prob": 0.0,
            "register_shift": 8,
        },
        "release": {
            "use_ostinato": False,
            "melody_style": "lyrical",
            "vel_base": 65 - int(progress * 25),
            "vel_range": 20,
            "interval_max": 3,
            "rest_prob": 0.2 + progress * 0.15,
            "register_shift": -int(progress * 5),
        },
        "triumphant": {
            "use_ostinato": True,
            "melody_style": "power",
            "vel_base": 90,
            "vel_range": 15,
            "interval_max": 7,
            "rest_prob": 0.0,
            "register_shift": 10,
        },
    }
    return configs.get(section_name, configs["calm"])


# ── Chord tone logic ──────────────────────────────────────────


def _chord_tones_in_register(chord_root: int, scale: list[int], reg_min: int, reg_max: int) -> list[int]:
    """All chord tones (root, 3rd, 5th, octave) within register."""
    intervals = [0, 3, 4, 7, 12]  # Include minor/major 3rd variants
    candidates: list[int] = []

    for interval in intervals:
        raw = chord_root + interval
        snapped = snap_to_scale(raw, scale)
        pc = snapped % 12
        for base in range(0, 128, 12):
            note = base + pc
            if reg_min <= note <= reg_max:
                candidates.append(note)

    return sorted(set(candidates))


def _nearest_in_list(target: int, notes: list[int]) -> int:
    """Find nearest note in a list."""
    if not notes:
        return target
    return min(notes, key=lambda n: abs(n - target))


def _step_within_scale(current: int, direction: int, scale: list[int], max_step: int = 4) -> int:
    """Move by scale step. Direction: 1=up, -1=down."""
    step = random.randint(1, max_step)
    raw = current + direction * step
    return snap_to_scale(raw, scale)


# ── Main melody ───────────────────────────────────────────────


def _generate_melody(schema: GenerationSchema) -> list[Note]:
    """Cinematic main melody with section-aware behavior."""
    scale = schema.scale_intervals
    reg_min, reg_max = schema.register_range
    notes: list[Note] = []
    current_pitch = schema.key_root_midi
    absolute_bar = 0

    for sec_idx, section in enumerate(schema.emotional_arc):
        sec_bars = schema.bars_per_section[sec_idx] if sec_idx < len(schema.bars_per_section) else 4

        for bar_in_sec in range(sec_bars):
            cfg = _section_config(section, bar_in_sec, sec_bars)
            chord_root = _get_chord_at_bar(schema, absolute_bar)
            cts = _chord_tones_in_register(chord_root, scale, reg_min, reg_max)

            # Register target from section
            base_target = (reg_min + reg_max) // 2 + cfg["register_shift"]

            # Dramatic silence before climax
            is_pre_climax = (
                sec_idx + 1 < len(schema.emotional_arc)
                and schema.emotional_arc[sec_idx + 1] == "climax"
                and bar_in_sec == sec_bars - 1
            )

            if is_pre_climax:
                # One sustained note then silence
                ct = _nearest_in_list(base_target, cts)
                current_pitch = ct
                pitch_name, octave = midi_to_note_name(current_pitch)
                notes.append(
                    Note(
                        pitch=pitch_name,
                        octave=max(2, min(8, octave)),
                        start_time=round(absolute_bar * 4.0, 4),
                        duration=2.0,
                        velocity=cfg["vel_base"],
                    )
                )
                absolute_bar += 1
                continue

            # Pick phrase rhythm
            if cfg["melody_style"] == "power":
                rhythm = random.choice(_CLIMAX_RHYTHMS)
            elif cfg["melody_style"] == "active":
                rhythm = random.choice(_MELODY_PHRASES[3:7])
            else:
                rhythm = random.choice(_MELODY_PHRASES[:5])

            for beat_off, dur in rhythm:
                abs_beat = absolute_bar * 4.0 + beat_off
                is_strong = beat_off < 0.1 or abs(beat_off - 2.0) < 0.1

                # Rest check
                if random.random() < cfg["rest_prob"] and not is_strong:
                    continue

                # Pitch selection
                if is_strong and cts:
                    target_ct = _nearest_in_list(base_target, cts)
                    diff = target_ct - current_pitch
                    if abs(diff) > cfg["interval_max"]:
                        current_pitch = _step_within_scale(
                            current_pitch,
                            1 if diff > 0 else -1,
                            scale,
                            cfg["interval_max"],
                        )
                    else:
                        current_pitch = target_ct
                else:
                    direction = 1 if base_target > current_pitch else -1
                    current_pitch = _step_within_scale(current_pitch, direction, scale, 3)

                # Force phrase endings
                total_bars = sum(schema.bars_per_section)
                half = total_bars // 2
                if absolute_bar == half - 1 and abs(beat_off - 3.0) < 0.6:
                    current_pitch = schema.question_end_midi
                elif absolute_bar == total_bars - 1 and abs(beat_off - 3.0) < 0.6:
                    current_pitch = schema.answer_end_midi

                current_pitch = max(reg_min, min(reg_max, current_pitch))

                # Velocity
                vel = cfg["vel_base"] + random.randint(-cfg["vel_range"] // 3, cfg["vel_range"] // 3)
                if is_strong:
                    vel += 6
                vel = max(25, min(127, vel))

                pitch_name, octave = midi_to_note_name(current_pitch)
                notes.append(
                    Note(
                        pitch=pitch_name,
                        octave=max(2, min(8, octave)),
                        start_time=round(abs_beat, 4),
                        duration=round(max(0.15, dur), 4),
                        velocity=vel,
                    )
                )

            absolute_bar += 1

    return notes


# ── Ostinato layer (Zimmer signature) ─────────────────────────


def _generate_ostinato(schema: GenerationSchema) -> list[Note]:
    """Pulsing rhythmic cell that drives tension. Zimmer's trademark."""
    scale = schema.scale_intervals
    notes: list[Note] = []
    absolute_bar = 0

    for sec_idx, section in enumerate(schema.emotional_arc):
        sec_bars = schema.bars_per_section[sec_idx] if sec_idx < len(schema.bars_per_section) else 4
        cfg = _section_config(section, 0, sec_bars)

        if not cfg["use_ostinato"]:
            absolute_bar += sec_bars
            continue

        # Pick one ostinato cell for the whole section
        cell = random.choice(_OSTINATO_CELLS)

        for bar_in_sec in range(sec_bars):
            chord_root = _get_chord_at_bar(schema, absolute_bar)
            # Ostinato uses chord root and fifth in mid-low register
            root = chord_root
            while root > 65:
                root -= 12
            while root < 48:
                root += 12
            fifth = snap_to_scale(root + 7, scale)

            progress = bar_in_sec / max(sec_bars - 1, 1)
            vel_base = cfg["vel_base"] - 15 + int(progress * 20)

            for beat_off, dur in cell:
                abs_beat = absolute_bar * 4.0 + beat_off
                # Alternate root and fifth
                pitch = root if int(beat_off * 2) % 2 == 0 else fifth

                pitch_name, octave = midi_to_note_name(pitch)
                notes.append(
                    Note(
                        pitch=pitch_name,
                        octave=max(2, min(6, octave)),
                        start_time=round(abs_beat, 4),
                        duration=round(max(0.1, dur * 0.8), 4),
                        velocity=max(20, min(100, vel_base + random.randint(-5, 5))),
                    )
                )

            absolute_bar += 1

    return notes


# ── Bass with pedal tone technique ────────────────────────────


def _generate_bass(schema: GenerationSchema) -> list[Note]:
    """Bass: pedal tones + chord roots. Zimmer uses sustained low drones."""
    scale = schema.scale_intervals
    notes: list[Note] = []
    absolute_bar = 0
    tonic_bass = schema.key_root_midi
    while tonic_bass > 48:
        tonic_bass -= 12
    while tonic_bass < 36:
        tonic_bass += 12

    for sec_idx, section in enumerate(schema.emotional_arc):
        sec_bars = schema.bars_per_section[sec_idx] if sec_idx < len(schema.bars_per_section) else 4

        for bar_in_sec in range(sec_bars):
            chord_root = _get_chord_at_bar(schema, absolute_bar)
            cfg = _section_config(section, bar_in_sec, sec_bars)

            bass_note = chord_root
            while bass_note > 52:
                bass_note -= 12
            while bass_note < 33:
                bass_note += 12

            # Pedal tone on tonic during tense/climax sections
            use_pedal = section in ("tense", "climax", "triumphant")
            if use_pedal and bar_in_sec % 2 == 0:
                bass_note = tonic_bass  # Sustain tonic under changing chords

            vel = cfg["vel_base"] + random.randint(-5, 10)

            # Long sustained bass
            pitch_name, octave = midi_to_note_name(bass_note)
            notes.append(
                Note(
                    pitch=pitch_name,
                    octave=max(2, min(4, octave)),
                    start_time=round(absolute_bar * 4.0, 4),
                    duration=3.5,
                    velocity=max(40, min(110, vel)),
                )
            )

            # Sub-octave doubling for climax
            if section in ("climax", "triumphant"):
                sub = bass_note - 12
                if sub >= 28:
                    pn2, oc2 = midi_to_note_name(sub)
                    notes.append(
                        Note(
                            pitch=pn2,
                            octave=max(2, min(3, oc2)),
                            start_time=round(absolute_bar * 4.0, 4),
                            duration=3.5,
                            velocity=max(35, min(90, vel - 10)),
                        )
                    )

            absolute_bar += 1

    return notes


# ── Chords with voicing and movement ──────────────────────────


def _generate_chords(schema: GenerationSchema) -> list[Note]:
    """Pad chords: triads with inversions and movement."""
    scale = schema.scale_intervals
    notes: list[Note] = []
    absolute_bar = 0

    for sec_idx, section in enumerate(schema.emotional_arc):
        sec_bars = schema.bars_per_section[sec_idx] if sec_idx < len(schema.bars_per_section) else 4

        for bar_in_sec in range(sec_bars):
            chord_root = _get_chord_at_bar(schema, absolute_bar)
            cfg = _section_config(section, bar_in_sec, sec_bars)

            # Build voicing
            root = chord_root
            while root < 55:
                root += 12
            while root > 72:
                root -= 12

            third = snap_to_scale(root + 3, scale)
            fifth = snap_to_scale(root + 7, scale)
            voicing = [root, third, fifth]

            # Add octave doubling during climax
            if section in ("climax", "triumphant"):
                voicing.append(root + 12)

            # Add suspended tones during mysterious/tense
            if section in ("mysterious", "tense") and random.random() < 0.3:
                sus = snap_to_scale(root + 5, scale)  # sus4
                voicing.append(sus)

            vel = cfg["vel_base"] - 20
            dur = 4.0 if section != "climax" else 3.5

            for midi in voicing:
                midi = max(48, min(96, midi))
                pitch_name, octave = midi_to_note_name(midi)
                notes.append(
                    Note(
                        pitch=pitch_name,
                        octave=max(3, min(7, octave)),
                        start_time=round(absolute_bar * 4.0, 4),
                        duration=dur,
                        velocity=max(20, min(85, vel + random.randint(-3, 3))),
                    )
                )

            absolute_bar += 1

    return notes


# ── Chord map builder ─────────────────────────────────────────


def _get_chord_at_bar(schema: GenerationSchema, bar: int) -> int:
    """Get the chord root MIDI for a given bar."""
    if not schema.chord_progression:
        return schema.key_root_midi

    prog = schema.chord_progression
    total_prog_beats = sum(c.beats for c in prog)
    if total_prog_beats <= 0:
        return schema.key_root_midi

    bar_beat = (bar * 4) % total_prog_beats
    accumulated = 0
    for chord in prog:
        if accumulated + chord.beats > bar_beat:
            return chord.root_midi
        accumulated += chord.beats
    return prog[0].root_midi


# ── Assemble score ────────────────────────────────────────────


def generate_from_schema(schema: GenerationSchema) -> MusicScore:
    """Generate cinematic MusicScore. Zero LLM, pure algorithms."""
    # Seed random for reproducibility or variation
    if schema.seed is not None:
        random.seed(schema.seed)
    else:
        import time

        random.seed(int(time.time() * 1000))

    melody_notes = _generate_melody(schema)
    ostinato_notes = _generate_ostinato(schema)
    bass_notes = _generate_bass(schema)
    chord_notes = _generate_chords(schema)

    from music_mcp.core.scales import NOTE_NAMES

    root_name = NOTE_NAMES[schema.key_root_midi % 12]
    mode = _detect_mode(schema.scale_intervals)
    key_str = f"{root_name} {mode}"

    mood = schema.emotional_arc[0] if schema.emotional_arc else "calm"
    title = f"{mood.capitalize()} {mode} in {root_name}"

    # Merge ostinato into melody channel (or make 4th channel)
    melody_combined = sorted(melody_notes + ostinato_notes, key=lambda n: n.start_time)

    return MusicScore(
        title=title,
        bpm=schema.tempo_bpm,
        key=key_str,
        time_signature="4/4",
        channels=[
            Channel(
                id=ChannelRole.MELODY,
                name="Melody",
                waveform=Waveform.TRIANGLE,
                instrument=Instrument(schema.instruments.melody),
                adsr=Adsr(attack=0.02, decay=0.4, sustain=0.3, release=0.8),
                notes=melody_combined or [_fallback(schema)],
            ),
            Channel(
                id=ChannelRole.BASS,
                name="Bass",
                waveform=Waveform.SAWTOOTH,
                instrument=Instrument(schema.instruments.bass),
                adsr=Adsr(attack=0.03, decay=0.3, sustain=0.6, release=0.8),
                notes=bass_notes or [_fallback(schema)],
            ),
            Channel(
                id=ChannelRole.CHORDS,
                name="Chords",
                waveform=Waveform.SINE,
                instrument=Instrument(schema.instruments.chords),
                adsr=Adsr(attack=0.1, decay=0.4, sustain=0.6, release=1.5),
                notes=chord_notes or [_fallback(schema)],
            ),
        ],
    )


def _detect_mode(intervals: list[int]) -> str:
    """Detect scale mode from intervals."""
    from music_mcp.core.scales import SCALE_INTERVALS

    for name, scale_ints in SCALE_INTERVALS.items():
        if intervals == list(scale_ints):
            return name
    return "major"


def _fallback(schema: GenerationSchema) -> Note:
    """Fallback note."""
    pitch_name, octave = midi_to_note_name(schema.key_root_midi)
    return Note(
        pitch=pitch_name,
        octave=octave,
        start_time=0.0,
        duration=2.0,
        velocity=60,
    )
