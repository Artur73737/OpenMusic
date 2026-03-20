"""Tension curve system mapping [0,1] to musical parameters."""

from dataclasses import dataclass


@dataclass
class TensionParams:
    """Musical parameters derived from tension level."""

    velocity_base: int
    register_offset: int
    note_density: float
    duration_scale: float
    dissonance_chance: float


# Predefined tension curves for common styles
TENSION_PRESETS: dict[str, list[float]] = {
    "cinematic": [0.1, 0.2, 0.4, 0.6, 0.9, 1.0, 0.7, 0.3],
    "edm_drop": [0.2, 0.5, 0.8, 1.0, 0.3, 0.1],
    "ballad": [0.1, 0.2, 0.3, 0.5, 0.4, 0.3, 0.2, 0.1],
    "buildup": [0.1, 0.2, 0.3, 0.5, 0.6, 0.8, 0.9, 1.0],
    "calm": [0.1, 0.15, 0.2, 0.15, 0.1, 0.15, 0.2, 0.1],
    "dramatic": [0.3, 0.6, 1.0, 0.4, 0.7, 1.0, 0.5, 0.2],
}


def tension_to_params(tension: float) -> TensionParams:
    """Convert tension [0,1] to concrete musical parameters."""
    clamped = max(0.0, min(1.0, tension))
    return TensionParams(
        velocity_base=40 + int(clamped * 70),
        register_offset=int(clamped * 12),
        note_density=0.3 + clamped * 0.6,
        duration_scale=1.0 - clamped * 0.3,
        dissonance_chance=clamped * 0.15,
    )


def interpolate_tension(
    curve: list[float],
    num_points: int,
) -> list[float]:
    """Stretch/compress tension curve to match num_points."""
    if not curve:
        return [0.5] * num_points
    if len(curve) == num_points:
        return list(curve)
    result: list[float] = []
    for i in range(num_points):
        pos = i * (len(curve) - 1) / max(num_points - 1, 1)
        idx_low = int(pos)
        idx_high = min(idx_low + 1, len(curve) - 1)
        frac = pos - idx_low
        val = curve[idx_low] * (1 - frac) + curve[idx_high] * frac
        result.append(val)
    return result
