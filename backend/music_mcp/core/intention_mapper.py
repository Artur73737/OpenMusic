"""Map LLM artistic intentions to deterministic generation parameters."""

from music_mcp.core.scales import ROOT_NAME_TO_SEMITONE, SCALE_INTERVALS
from music_mcp.models.composition_schema import (
    ChordStep,
    GenerationSchema,
    InstrumentSelection,
    LlmIntention,
)

# ── Key parsing ────────────────────────────────────────────────

_MODE_ALIASES: dict[str, str] = {
    "major": "major",
    "minor": "minor",
    "min": "minor",
    "maj": "major",
    "dorian": "dorian",
    "phrygian": "phrygian",
    "mixolydian": "mixolydian",
    "harmonic minor": "harmonic_minor",
    "blues": "blues",
    "pentatonic": "pentatonic_minor",
}


def _parse_key(key_str: str) -> tuple[int, list[int]]:
    """Parse 'C minor' -> (60, [0,2,3,5,7,8,10])."""
    parts = key_str.strip().split()
    root_name = parts[0] if parts else "C"
    mode_name = " ".join(parts[1:]).lower() if len(parts) > 1 else "major"

    root_semitone = ROOT_NAME_TO_SEMITONE.get(root_name, 0)
    root_midi = 60 + root_semitone

    mode_key = _MODE_ALIASES.get(mode_name, "major")
    intervals = list(SCALE_INTERVALS.get(mode_key, SCALE_INTERVALS["major"]))

    return root_midi, intervals


# ── Chord progression templates (cinematic focus) ─────────────

_CHORD_TEMPLATES: dict[str, list[tuple[int, int]]] = {
    # Zimmer-style: modal, dramatic, unexpected resolutions
    "zimmer_dark": [
        (0, 4),
        (3, 4),
        (7, 4),
        (5, 4),  # i - III - v - iv
        (0, 4),
        (8, 4),
        (3, 4),
        (7, 4),  # i - VI - III - v
    ],
    "zimmer_epic": [
        (0, 4),
        (7, 4),
        (3, 4),
        (5, 4),  # i - v - III - iv
        (0, 4),
        (5, 4),
        (3, 8),  # i - iv - III (long)
    ],
    "zimmer_hope": [
        (0, 4),
        (5, 4),
        (7, 4),
        (0, 4),  # i - iv - v - i
        (3, 4),
        (5, 4),
        (0, 8),  # III - iv - i (resolve)
    ],
    "interstellar": [
        (0, 8),
        (5, 8),  # i ---- iv ----
        (3, 8),
        (7, 8),  # III --- v ----
    ],
    "inception": [
        (0, 4),
        (0, 4),
        (5, 4),
        (5, 4),  # i - i - iv - iv
        (3, 4),
        (3, 4),
        (7, 4),
        (0, 4),  # III - III - v - i
    ],
    "dunkirk": [
        (0, 2),
        (0, 2),
        (0, 2),
        (0, 2),  # Obsessive tonic
        (5, 2),
        (5, 2),
        (7, 2),
        (0, 2),  # iv iv v i
    ],
    "major_heroic": [
        (0, 4),
        (5, 4),
        (7, 4),
        (0, 4),  # I - IV - V - I
        (9, 4),
        (5, 4),
        (7, 4),
        (0, 4),  # vi - IV - V - I
    ],
    "major_emotional": [
        (0, 4),
        (9, 4),
        (5, 4),
        (7, 4),  # I - vi - IV - V
        (0, 4),
        (5, 4),
        (9, 4),
        (7, 4),  # I - IV - vi - V
    ],
    "sad_cinematic": [
        (0, 8),
        (3, 4),
        (5, 4),  # i ---- III - iv
        (8, 4),
        (7, 4),
        (0, 8),  # VI - v - i ----
    ],
    "jazz_modal": [
        (0, 4),
        (2, 4),
        (5, 4),
        (0, 4),  # i - ii - iv - i
        (7, 4),
        (5, 4),
        (3, 4),
        (0, 4),  # v - iv - III - i
    ],
    "edm_power": [
        (0, 4),
        (0, 4),
        (5, 4),
        (7, 4),  # i - i - iv - v
        (0, 4),
        (3, 4),
        (5, 4),
        (7, 4),  # i - III - iv - v
    ],
    "ambient": [
        (0, 8),
        (5, 8),  # i ---- iv ----
        (0, 8),
        (7, 8),  # i ---- v ----
    ],
}

_STYLE_TO_CHORDS: dict[str, str] = {
    "cinematic": "zimmer_dark",
    "film": "zimmer_epic",
    "epic": "zimmer_epic",
    "dark": "zimmer_dark",
    "hopeful": "zimmer_hope",
    "jazz": "jazz_modal",
    "pop": "major_emotional",
    "rock": "major_heroic",
    "electronic": "edm_power",
    "edm": "edm_power",
    "blues": "jazz_modal",
    "lo-fi": "ambient",
    "lofi": "ambient",
    "sad": "sad_cinematic",
    "melancholic": "sad_cinematic",
    "classical": "major_heroic",
    "ambient": "ambient",
}

# ── Mood to chord override ────────────────────────────────────

_MOOD_CHORD_OVERRIDE: dict[str, str] = {
    "dark": "zimmer_dark",
    "mysterious": "inception",
    "triumphant": "zimmer_epic",
    "melancholic": "interstellar",
    "sad": "sad_cinematic",
    "calm": "ambient",
}


def _build_chords(
    root_midi: int,
    scale_intervals: list[int],
    style: str,
    mood: str,
) -> list[ChordStep]:
    """Build chord progression. Mood can override style default."""
    template_key = _MOOD_CHORD_OVERRIDE.get(mood.lower())
    if not template_key:
        template_key = _STYLE_TO_CHORDS.get(style.lower(), "zimmer_dark")
    template = _CHORD_TEMPLATES.get(template_key, _CHORD_TEMPLATES["zimmer_dark"])

    chords: list[ChordStep] = []
    for offset, beats in template:
        chord_root = root_midi + offset
        chords.append(ChordStep(root_midi=chord_root, beats=beats))
    return chords


# ── Section bar counts (longer = more cinematic) ──────────────

_SECTION_BARS: dict[str, int] = {
    "calm": 4,
    "mysterious": 4,
    "tense": 4,
    "climax": 2,
    "release": 4,
    "triumphant": 4,
}


# ── Energy/density ────────────────────────────────────────────

_ENERGY_MAP: dict[str, dict[str, float]] = {
    "low": {"rest_prob": 0.25, "vel_min": 30, "vel_max": 70},
    "medium": {"rest_prob": 0.15, "vel_min": 40, "vel_max": 95},
    "high": {"rest_prob": 0.05, "vel_min": 55, "vel_max": 115},
}


# ── Main mapper ───────────────────────────────────────────────


def intention_to_schema(intention: LlmIntention) -> GenerationSchema:
    """Convert LLM artistic intention to deterministic schema."""
    root_midi, scale_intervals = _parse_key(intention.key)

    chords = _build_chords(
        root_midi,
        scale_intervals,
        intention.style,
        intention.mood,
    )

    energy = _ENERGY_MAP.get(intention.energy.lower(), _ENERGY_MAP["medium"])

    # Tension note = 5th degree (dominant)
    fifth_idx = 4 if len(scale_intervals) > 4 else len(scale_intervals) - 1
    tension_midi = root_midi + scale_intervals[fifth_idx]

    # Question end = 3rd degree (mediant)
    third_idx = 2 if len(scale_intervals) > 2 else 0
    question_midi = root_midi + scale_intervals[third_idx]

    # Answer end = tonic
    answer_midi = root_midi

    # Register
    reg_min = max(36, root_midi - 12)
    reg_max = min(96, root_midi + 24)

    # Bars per section based on section type
    bars_per = [_SECTION_BARS.get(s, 4) for s in intention.emotional_arc]

    return GenerationSchema(
        tempo_bpm=intention.tempo_bpm,
        key_root_midi=root_midi,
        scale_intervals=scale_intervals,
        chord_progression=chords,
        contour=intention.contour,
        phrase_bars=8,
        tension_note_midi=tension_midi,
        question_end_midi=question_midi,
        answer_end_midi=answer_midi,
        rhythm_variance=0.4,
        rest_probability=energy["rest_prob"],
        note_duration_range=(0.25, 3.0),
        register_range=(reg_min, reg_max),
        velocity_range=(int(energy["vel_min"]), int(energy["vel_max"])),
        emotional_arc=intention.emotional_arc,
        bars_per_section=bars_per,
        instruments=intention.instruments,
    )
