"""Rhythm templates providing beat-level note placement patterns."""

import random

# Each template: list of (beat_offset, duration) tuples per bar
# Duration in beats. Gaps create rests.
RHYTHM_TEMPLATES: dict[str, list[tuple[float, float]]] = {
    "cinematic": [
        (0.0, 1.5), (2.0, 0.5), (2.5, 0.5), (3.5, 0.5),
    ],
    "tension": [
        (0.0, 0.25), (0.5, 0.25), (1.5, 0.5), (3.0, 1.0),
    ],
    "groove": [
        (0.0, 1.0), (1.5, 0.5), (2.0, 0.5), (2.75, 0.25), (3.0, 0.5),
    ],
    "staccato": [
        (0.0, 0.25), (0.5, 0.25), (1.0, 0.25), (1.5, 0.25),
        (2.0, 0.25), (2.5, 0.25), (3.0, 0.25), (3.5, 0.25),
    ],
    "legato": [
        (0.0, 2.0), (2.0, 2.0),
    ],
    "waltz": [
        (0.0, 1.0), (1.0, 0.5), (1.5, 0.5), (2.0, 1.0),
    ],
    "syncopated": [
        (0.0, 0.5), (0.75, 0.75), (1.5, 0.5), (2.5, 0.5), (3.25, 0.75),
    ],
}

# Bass-specific rhythms (sparser, root-heavy)
BASS_TEMPLATES: dict[str, list[tuple[float, float]]] = {
    "root_fifth": [(0.0, 2.0), (2.0, 2.0)],
    "walking": [(0.0, 1.0), (1.0, 1.0), (2.0, 1.0), (3.0, 1.0)],
    "driving": [(0.0, 0.5), (0.5, 0.5), (1.0, 0.5), (1.5, 0.5),
                (2.0, 0.5), (2.5, 0.5), (3.0, 0.5), (3.5, 0.5)],
    "sparse": [(0.0, 3.0), (3.0, 1.0)],
    "syncopated": [(0.0, 1.5), (1.5, 0.5), (2.5, 1.5)],
}

# Chord rhythms
CHORD_TEMPLATES: dict[str, list[tuple[float, float]]] = {
    "regular": [(0.0, 4.0)],
    "half": [(0.0, 2.0), (2.0, 2.0)],
    "syncopated": [(0.0, 1.5), (1.5, 2.5)],
    "irregular": [(0.0, 3.0), (3.0, 1.0)],
    "arpeggiated": [(0.0, 1.0), (1.0, 1.0), (2.0, 1.0), (3.0, 1.0)],
}


def get_rhythm_events(
    template_name: str,
    num_bars: int,
    density: float = 1.0,
) -> list[tuple[float, float]]:
    """Generate rhythm events for multiple bars.

    Returns list of (absolute_beat, duration) tuples.
    """
    template = RHYTHM_TEMPLATES.get(
        template_name,
        RHYTHM_TEMPLATES["groove"],
    )
    events: list[tuple[float, float]] = []
    for bar in range(num_bars):
        bar_offset = bar * 4.0
        for beat, dur in template:
            # Apply density filter — randomly skip notes
            if random.random() > density:
                continue
            events.append((bar_offset + beat, dur))
    return events
