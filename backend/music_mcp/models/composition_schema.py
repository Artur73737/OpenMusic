"""Schema for LLM high-level output and Python generation parameters."""

from pydantic import BaseModel, Field


class InstrumentSelection(BaseModel):
    """Instrument selection for each channel."""

    melody: str = Field(default="piano")
    bass: str = Field(default="bass_synth")
    chords: str = Field(default="synth_pad")


class ChordStep(BaseModel):
    """A single chord in the progression."""

    root_midi: int = Field(ge=24, le=96)
    beats: int = Field(ge=1, le=16, default=4)


class GenerationSchema(BaseModel):
    """Complete deterministic schema that Python uses to generate notes.

    The LLM populates ONLY the high-level fields (style, mood, tempo,
    key, contour). Python fills in ALL the musical detail.
    """

    tempo_bpm: int = Field(ge=40, le=240, default=120)
    key_root_midi: int = Field(ge=36, le=84, default=60)
    scale_intervals: list[int] = Field(
        default_factory=lambda: [0, 2, 4, 5, 7, 9, 11],
    )
    chord_progression: list[ChordStep] = Field(
        default_factory=lambda: [
            ChordStep(root_midi=60, beats=4),
            ChordStep(root_midi=65, beats=4),
            ChordStep(root_midi=67, beats=4),
            ChordStep(root_midi=60, beats=4),
        ],
    )
    contour: str = Field(default="arch")
    phrase_bars: int = Field(ge=2, le=32, default=8)
    tension_note_midi: int = Field(default=67)
    question_end_midi: int = Field(default=64)
    answer_end_midi: int = Field(default=60)
    rhythm_variance: float = Field(ge=0, le=1, default=0.4)
    rest_probability: float = Field(ge=0, le=0.6, default=0.2)
    note_duration_range: tuple[float, float] = Field(
        default=(0.25, 2.0),
    )
    register_range: tuple[int, int] = Field(
        default=(48, 84),
    )
    velocity_range: tuple[int, int] = Field(
        default=(45, 100),
    )
    emotional_arc: list[str] = Field(
        default_factory=lambda: ["calm", "tense", "climax", "release"],
    )
    bars_per_section: list[int] = Field(
        default_factory=lambda: [4, 4, 2, 4],
    )
    instruments: InstrumentSelection = Field(
        default_factory=InstrumentSelection,
    )


class LlmIntention(BaseModel):
    """The ONLY thing the LLM outputs. No notes, no intervals, no MIDI.

    Just artistic intention that Python maps to GenerationSchema.
    """

    style: str = Field(default="cinematic")
    mood: str = Field(default="melancholic")
    tempo_bpm: int = Field(ge=40, le=240, default=120)
    key: str = Field(default="C minor")
    contour: str = Field(default="arch")
    emotional_arc: list[str] = Field(
        default_factory=lambda: ["calm", "tense", "climax", "release"],
    )
    density: str = Field(default="medium")
    energy: str = Field(default="medium")
    instruments: InstrumentSelection = Field(
        default_factory=InstrumentSelection,
    )
