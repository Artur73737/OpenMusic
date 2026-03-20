"""Melodic contour functions mapping position to shape [0,1]."""

import math
from typing import Callable


ContourFunc = Callable[[int, int], float]

CONTOUR_FUNCTIONS: dict[str, ContourFunc] = {
    "arch": lambda n, i: max(0.0, -4 * (i / max(n, 1) - 0.5) ** 2 + 1),
    "inverted_arch": lambda n, i: 4 * (i / max(n, 1) - 0.5) ** 2,
    "ascending": lambda n, i: i / max(n - 1, 1),
    "descending": lambda n, i: 1 - i / max(n - 1, 1),
    "wave": lambda n, i: (math.sin(i * math.pi * 2 / max(n, 1)) + 1) / 2,
    "staircase": lambda n, i: round(i * 4 / max(n, 1)) / 4,
    "plateau": lambda n, i: min(1.0, i / max(n * 0.3, 1)) if i < n * 0.7 else max(0.0, 1 - (i - n * 0.7) / max(n * 0.3, 1)),
}


def get_contour_values(
    contour_name: str,
    num_points: int,
) -> list[float]:
    """Generate contour values for N points."""
    func = CONTOUR_FUNCTIONS.get(
        contour_name,
        CONTOUR_FUNCTIONS["arch"],
    )
    return [func(num_points, i) for i in range(num_points)]


def apply_contour_to_range(
    contour_values: list[float],
    min_midi: int,
    max_midi: int,
) -> list[int]:
    """Map contour values [0,1] to MIDI range."""
    midi_range = max_midi - min_midi
    return [
        min_midi + int(v * midi_range)
        for v in contour_values
    ]
