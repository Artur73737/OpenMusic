"""Velocity and articulation engine based on beat position and tension."""


def assign_velocity(
    beat_position: float,
    tension: float,
    is_chord_tone: bool,
    is_phrase_end: bool,
) -> int:
    """Calculate velocity for a note based on musical context."""
    base = 60
    beat_in_bar = beat_position % 4

    # Strong/weak beat weighting
    if beat_in_bar < 0.1:
        base += 20  # Beat 1 is strongest
    elif abs(beat_in_bar - 2.0) < 0.1:
        base += 10  # Beat 3 is secondary
    elif abs(beat_in_bar - 1.0) < 0.1 or abs(beat_in_bar - 3.0) < 0.1:
        base -= 5  # Beats 2, 4 are weak

    # Tension drives volume
    base += int(tension * 40)

    # Passing tones are softer
    if not is_chord_tone:
        base -= 12

    # Phrase endings are emphasized
    if is_phrase_end:
        base += 15

    return max(30, min(127, base))


def assign_articulation(
    tension: float,
    density: float,
) -> float:
    """Return duration multiplier based on tension/density.

    > 1.0 = legato, < 1.0 = staccato, 1.0 = normal.
    """
    if tension > 0.8:
        return 0.6  # Staccato under high tension
    if tension < 0.3 and density < 0.4:
        return 1.3  # Legato in calm sparse sections
    return 1.0


def humanize_velocity(velocity: int, amount: int = 8) -> int:
    """Add small random variation to velocity for human feel."""
    import random
    offset = random.randint(-amount, amount)
    return max(30, min(127, velocity + offset))
