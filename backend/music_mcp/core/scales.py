"""Scale definitions and pitch math utilities."""

import random

# Semitone intervals from root for each scale mode
SCALE_INTERVALS: dict[str, list[int]] = {
    "major": [0, 2, 4, 5, 7, 9, 11],
    "minor": [0, 2, 3, 5, 7, 8, 10],
    "dorian": [0, 2, 3, 5, 7, 9, 10],
    "phrygian": [0, 1, 3, 5, 7, 8, 10],
    "mixolydian": [0, 2, 4, 5, 7, 9, 10],
    "harmonic_minor": [0, 2, 3, 5, 7, 8, 11],
    "pentatonic_major": [0, 2, 4, 7, 9],
    "pentatonic_minor": [0, 3, 5, 7, 10],
    "blues": [0, 3, 5, 6, 7, 10],
}

NOTE_NAMES = [
    "C", "C#", "D", "D#", "E", "F",
    "F#", "G", "G#", "A", "A#", "B",
]

ROOT_NAME_TO_SEMITONE: dict[str, int] = {
    "C": 0, "C#": 1, "Db": 1,
    "D": 2, "D#": 3, "Eb": 3,
    "E": 4, "F": 5, "F#": 6,
    "Gb": 6, "G": 7, "G#": 8,
    "Ab": 8, "A": 9, "A#": 10,
    "Bb": 10, "B": 11,
}


def parse_key(key_string: str) -> tuple[int, str]:
    """Parse 'C major' or 'Eb minor' into (root_semitone, mode)."""
    parts = key_string.strip().split()
    root_name = parts[0] if parts else "C"
    mode = parts[1] if len(parts) > 1 else "major"
    root = ROOT_NAME_TO_SEMITONE.get(root_name, 0)
    return root, mode


def get_scale_pitches(root: int, mode: str) -> list[int]:
    """Return all MIDI pitches in scale across full range."""
    intervals = SCALE_INTERVALS.get(mode, SCALE_INTERVALS["major"])
    return [(root + i) % 12 for i in intervals]


def snap_to_scale(midi_note: int, scale_pitches: list[int]) -> int:
    """Snap a MIDI note to the nearest note in the scale."""
    pitch_class = midi_note % 12
    if pitch_class in scale_pitches:
        return midi_note
    # Find closest scale pitch
    distances = []
    for sp in scale_pitches:
        dist = min(abs(pitch_class - sp), 12 - abs(pitch_class - sp))
        distances.append((dist, sp))
    closest = min(distances, key=lambda x: x[0])[1]
    octave = midi_note // 12
    result = octave * 12 + closest
    # Keep within 1 semitone of original
    if abs(result - midi_note) > 6:
        result += 12 if result < midi_note else -12
    return result


def midi_to_note_name(midi: int) -> tuple[str, int]:
    """Convert MIDI number to (pitch_name, octave)."""
    octave = (midi // 12) - 1
    pitch = NOTE_NAMES[midi % 12]
    return pitch, octave


def note_name_to_midi(pitch: str, octave: int) -> int:
    """Convert pitch name and octave to MIDI number."""
    semitone = ROOT_NAME_TO_SEMITONE.get(pitch, 0)
    return (octave + 1) * 12 + semitone


def random_scale_note(
    scale_pitches: list[int],
    min_midi: int = 48,
    max_midi: int = 84,
) -> int:
    """Pick a random note within range that belongs to scale."""
    candidates = [
        m for m in range(min_midi, max_midi + 1)
        if m % 12 in scale_pitches
    ]
    return random.choice(candidates) if candidates else 60
