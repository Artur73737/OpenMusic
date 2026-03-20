import re
from enum import StrEnum

from pydantic import BaseModel, Field, field_validator


class Waveform(StrEnum):
    SINE = "sine"
    TRIANGLE = "triangle"
    SQUARE = "square"
    SAWTOOTH = "sawtooth"


class TimeSignature(StrEnum):
    FOUR_FOUR = "4/4"
    THREE_FOUR = "3/4"
    SIX_EIGHT = "6/8"


class ChannelRole(StrEnum):
    MELODY = "melody"
    BASS = "bass"
    CHORDS = "chords"


class Instrument(StrEnum):
    PIANO = "piano"
    ELECTRIC_PIANO = "electric_piano"
    SYNTH_PAD = "synth_pad"
    STRINGS = "strings"
    ORGAN = "organ"
    PLUCK = "pluck"
    BASS_SYNTH = "bass_synth"
    BASS = "bass"
    BELL = "bell"


class Adsr(BaseModel):
    attack: float = Field(ge=0.001)
    decay: float = Field(ge=0.001)
    sustain: float = Field(ge=0.0, le=1.0)
    release: float = Field(ge=0.001)


class Note(BaseModel):
    pitch: str
    octave: int = Field(ge=2, le=7)
    start_time: float = Field(ge=0.0)
    duration: float = Field(gt=0.0)
    velocity: int = Field(ge=1, le=127)

    @field_validator("pitch")
    @classmethod
    def validate_pitch(cls, v: str) -> str:
        pattern = r"^[A-G][#b]?$"
        if not re.match(pattern, v):
            raise ValueError(f"Invalid pitch: {v}. Must be A-G with optional # or b")
        return v


class Channel(BaseModel):
    id: ChannelRole
    name: str
    waveform: Waveform
    instrument: Instrument
    adsr: Adsr
    notes: list[Note] = Field(min_length=1)


class MusicScore(BaseModel):
    title: str
    bpm: int = Field(ge=40, le=240)
    key: str
    time_signature: TimeSignature
    channels: list[Channel] = Field(min_length=1)


class RhythmBeat(BaseModel):
    beat: float = Field(ge=0.0)
    duration: float = Field(gt=0.0)
    accent: bool
    type: str = Field(pattern="^(bass|chord|melody|rest)$")


class RhythmScore(BaseModel):
    bpm: int = Field(ge=40, le=240)
    time_signature: TimeSignature
    bars: int = Field(ge=1)
    pattern: list[RhythmBeat]


class Composition(BaseModel):
    melody: MusicScore
    rhythm: RhythmScore
