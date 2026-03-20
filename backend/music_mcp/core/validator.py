"""Multi-criteria melody validation pipeline."""

from dataclasses import dataclass, field


@dataclass
class ValidationResult:
    """Outcome of melody validation."""

    is_valid: bool
    score: float
    errors: list[str] = field(default_factory=list)


def validate_melody(
    pitches: list[int],
    scale_pitches: list[int],
    tonic: int,
) -> ValidationResult:
    """Run all validation checks and return aggregate result."""
    errors: list[str] = []
    scores: list[float] = []

    scale_score = _check_scale_adherence(pitches, scale_pitches)
    scores.append(scale_score)
    if scale_score < 0.8:
        errors.append(f"Scale adherence {scale_score:.0%} below 80%")

    interval_score = _check_interval_quality(pitches)
    scores.append(interval_score)
    if interval_score < 0.7:
        errors.append(f"Interval quality {interval_score:.0%} below 70%")

    variety_score = _check_pitch_variety(pitches)
    scores.append(variety_score)
    if variety_score < 0.3:
        errors.append("Pitch variety too low (too repetitive)")

    range_score = _check_register_range(pitches)
    scores.append(range_score)
    if range_score < 0.3:
        errors.append("Register range too narrow")

    avg_score = sum(scores) / len(scores) if scores else 0
    return ValidationResult(
        is_valid=len(errors) == 0,
        score=avg_score,
        errors=errors,
    )


def _check_scale_adherence(
    pitches: list[int],
    scale_pitches: list[int],
) -> float:
    """Percentage of notes that belong to the target scale."""
    if not pitches:
        return 1.0
    in_scale = sum(1 for p in pitches if p % 12 in scale_pitches)
    return in_scale / len(pitches)


def _check_interval_quality(pitches: list[int]) -> float:
    """Penalize bad intervals (tritone, minor 7th leaps)."""
    if len(pitches) < 2:
        return 1.0
    bad_intervals = {6, 10}  # Tritone, minor 7th
    bad_count = 0
    for i in range(len(pitches) - 1):
        interval = abs(pitches[i + 1] - pitches[i]) % 12
        if interval in bad_intervals:
            bad_count += 1
    return 1.0 - (bad_count / (len(pitches) - 1))


def _check_pitch_variety(pitches: list[int]) -> float:
    """Entropy proxy: unique pitch classes / total notes."""
    if not pitches:
        return 1.0
    unique_classes = len(set(p % 12 for p in pitches))
    return min(1.0, unique_classes / max(len(pitches) * 0.3, 1))


def _check_register_range(pitches: list[int]) -> float:
    """Score based on how much of the available range is used."""
    if not pitches:
        return 1.0
    used_range = max(pitches) - min(pitches)
    # Ideal range is 12-24 semitones (1-2 octaves)
    if used_range < 5:
        return 0.2
    if used_range > 36:
        return 0.5  # Too wide
    return min(1.0, used_range / 18)
