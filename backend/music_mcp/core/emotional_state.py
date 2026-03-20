"""Emotional state machine mapping mood to musical parameters."""

from dataclasses import dataclass


@dataclass
class EmotionalParams:
    """All parameters controlled by the current emotional state."""

    tempo_multiplier: float
    register_min: int
    register_max: int
    note_density: float
    scale_mode: str
    velocity_base: int
    articulation: str
    chord_rhythm: str


EMOTIONAL_STATES: dict[str, EmotionalParams] = {
    "calm": EmotionalParams(
        tempo_multiplier=0.8,
        register_min=48, register_max=72,
        note_density=0.3, scale_mode="major",
        velocity_base=50, articulation="legato",
        chord_rhythm="regular",
    ),
    "tense": EmotionalParams(
        tempo_multiplier=1.0,
        register_min=55, register_max=79,
        note_density=0.6, scale_mode="phrygian",
        velocity_base=75, articulation="normal",
        chord_rhythm="syncopated",
    ),
    "climax": EmotionalParams(
        tempo_multiplier=1.2,
        register_min=60, register_max=96,
        note_density=0.9, scale_mode="major",
        velocity_base=100, articulation="staccato",
        chord_rhythm="irregular",
    ),
    "release": EmotionalParams(
        tempo_multiplier=0.9,
        register_min=48, register_max=72,
        note_density=0.4, scale_mode="major",
        velocity_base=60, articulation="legato",
        chord_rhythm="regular",
    ),
    "mysterious": EmotionalParams(
        tempo_multiplier=0.7,
        register_min=36, register_max=67,
        note_density=0.25, scale_mode="dorian",
        velocity_base=45, articulation="legato",
        chord_rhythm="irregular",
    ),
    "triumphant": EmotionalParams(
        tempo_multiplier=1.1,
        register_min=60, register_max=96,
        note_density=0.7, scale_mode="major",
        velocity_base=95, articulation="normal",
        chord_rhythm="regular",
    ),
}


def get_emotional_params(state_name: str) -> EmotionalParams:
    """Get parameters for a named emotional state."""
    return EMOTIONAL_STATES.get(
        state_name,
        EMOTIONAL_STATES["calm"],
    )


def blend_params(
    params_a: EmotionalParams,
    params_b: EmotionalParams,
    blend: float,
) -> EmotionalParams:
    """Linearly blend between two emotional states (0=a, 1=b)."""
    t = max(0.0, min(1.0, blend))
    return EmotionalParams(
        tempo_multiplier=_lerp(params_a.tempo_multiplier, params_b.tempo_multiplier, t),
        register_min=int(_lerp(params_a.register_min, params_b.register_min, t)),
        register_max=int(_lerp(params_a.register_max, params_b.register_max, t)),
        note_density=_lerp(params_a.note_density, params_b.note_density, t),
        scale_mode=params_b.scale_mode if t > 0.5 else params_a.scale_mode,
        velocity_base=int(_lerp(params_a.velocity_base, params_b.velocity_base, t)),
        articulation=params_b.articulation if t > 0.5 else params_a.articulation,
        chord_rhythm=params_b.chord_rhythm if t > 0.5 else params_a.chord_rhythm,
    )


def _lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t
