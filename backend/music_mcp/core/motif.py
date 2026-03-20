"""Canonical motif transformations for melodic development."""

import random


def inversion(intervals: list[int]) -> list[int]:
    """Reflect intervals around the root (negate each)."""
    return [-i for i in intervals]


def retrograde(intervals: list[int]) -> list[int]:
    """Reverse the temporal order of intervals."""
    return list(reversed(intervals))


def sequence(
    intervals: list[int],
    transposition: int = 2,
) -> list[int]:
    """Transpose the entire motif up by semitones."""
    return [i + transposition for i in intervals]


def augmentation(
    intervals: list[int],
    factor: float = 2.0,
) -> list[int]:
    """Stretch intervals (multiply by factor)."""
    return [int(i * factor) for i in intervals]


def diminution(
    intervals: list[int],
    factor: float = 0.5,
) -> list[int]:
    """Compress intervals (multiply by factor)."""
    return [max(1, int(i * factor)) if i > 0 else min(-1, int(i * factor)) for i in intervals]


def fragmentation(
    intervals: list[int],
    keep_ratio: float = 0.5,
) -> list[int]:
    """Keep only the first portion of the motif."""
    keep = max(1, int(len(intervals) * keep_ratio))
    return intervals[:keep]


TRANSFORMATION_MAP: dict[str, callable] = {
    "inversion": inversion,
    "retrograde": retrograde,
    "sequence": sequence,
    "augmentation": augmentation,
    "diminution": diminution,
    "fragmentation": fragmentation,
}


def expand_motif_to_notes(
    motif_intervals: list[int],
    root_midi: int,
    scale_pitches: list[int],
    transformations: list[str],
    total_notes: int,
) -> list[int]:
    """Expand a motif with transformations to fill total_notes."""
    from music_mcp.core.scales import snap_to_scale

    # Build original phrase from intervals
    phrases: list[list[int]] = [_intervals_to_midi(motif_intervals, root_midi)]

    # Apply each requested transformation
    for transform_name in transformations:
        func = TRANSFORMATION_MAP.get(transform_name)
        if not func:
            continue
        transformed = func(motif_intervals)
        start = phrases[-1][-1] if phrases[-1] else root_midi
        phrases.append(_intervals_to_midi(transformed, start))

    # Flatten and extend to fill total_notes
    all_notes = [n for phrase in phrases for n in phrase]
    while len(all_notes) < total_notes:
        offset = random.choice([0, 2, -2, 5, 7])
        shifted = [n + offset for n in motif_intervals]
        start = all_notes[-1] if all_notes else root_midi
        all_notes.extend(_intervals_to_midi(shifted, start))

    # Snap all to scale and trim
    return [snap_to_scale(n, scale_pitches) for n in all_notes[:total_notes]]


def _intervals_to_midi(
    intervals: list[int],
    start: int,
) -> list[int]:
    """Convert relative intervals to absolute MIDI notes."""
    result = [start]
    for interval in intervals:
        result.append(result[-1] + interval)
    return result
