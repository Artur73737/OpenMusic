"""Composition service: LLM generates intention, Python generates all notes."""

import structlog
from pydantic import ValidationError

from music_mcp.core.intention_mapper import intention_to_schema
from music_mcp.core.prompts import MELODY_SYSTEM
from music_mcp.models.composition_schema import (
    GenerationSchema,
    LlmIntention,
)
from music_mcp.models.music import (
    Composition,
    MusicScore,
    RhythmBeat,
    RhythmScore,
)
from music_mcp.services.melody_generator import generate_from_schema
from music_mcp.services.nvidia_client import NvidiaClient
from music_mcp.utils.json_parser import parse_model_json

logger = structlog.get_logger()

MAX_RETRIES = 2

# Default intention when LLM fails completely
_DEFAULT_INTENTION = LlmIntention(
    style="cinematic",
    mood="melancholic",
    tempo_bpm=96,
    key="A minor",
    contour="arch",
    emotional_arc=["calm", "tense", "climax", "release"],
    density="medium",
    energy="medium",
)


class CompositionService:
    def __init__(self, client: NvidiaClient) -> None:
        self._client = client

    async def _get_intention(
        self,
        prompt: str,
        model: str | None = None,
    ) -> LlmIntention:
        """Ask the LLM for artistic intention ONLY."""
        messages = [
            {"role": "system", "content": MELODY_SYSTEM},
            {"role": "user", "content": prompt},
        ]

        try:
            response = await self._client.chat(messages, model=model, max_tokens=512)
            data = parse_model_json(response)
            intention = LlmIntention.model_validate(data)
            logger.info(
                "intention_received",
                style=intention.style,
                mood=intention.mood,
                key=intention.key,
                tempo=intention.tempo_bpm,
            )
            return intention
        except Exception as exc:
            logger.warning(
                "intention_fallback",
                error=str(exc)[:150],
            )
            return _DEFAULT_INTENTION

    async def generate_melody(
        self,
        prompt: str,
        model: str | None = None,
        duration_seconds: int | None = None,
        bpm: int | None = None,
        seed: int | None = None,
    ) -> MusicScore:
        """LLM -> intention -> schema -> algorithmic notes."""
        intention = await self._get_intention(prompt, model)

        if bpm:
            intention.tempo_bpm = bpm

        # Map intention to deterministic schema
        schema = intention_to_schema(intention)

        # Add seed for variation
        schema.seed = seed

        # Override duration if specified
        if duration_seconds and duration_seconds > 0:
            bars = max(
                2,
                int((duration_seconds / 60) * schema.tempo_bpm / 4),
            )
            num_sections = len(schema.emotional_arc)
            schema.bars_per_section = _distribute_bars(bars, num_sections)

        logger.info(
            "schema_built",
            key=schema.key_root_midi,
            scale=schema.scale_intervals,
            chords=len(schema.chord_progression),
            bars=sum(schema.bars_per_section),
        )

        # Generate all notes algorithmically — zero LLM
        score = generate_from_schema(schema)

        logger.info(
            "melody_generated",
            title=score.title,
            channels=len(score.channels),
            total_notes=sum(len(ch.notes) for ch in score.channels),
        )
        return score

    async def generate_composition(
        self,
        prompt: str,
        model: str | None = None,
        duration_seconds: int | None = None,
        bpm: int | None = None,
        seed: int | None = None,
    ) -> Composition:
        """Full composition: melody + auto rhythm."""
        melody = await self.generate_melody(prompt, model, duration_seconds, bpm, seed)

        effective_bpm = bpm or melody.bpm
        total_beats = max(
            (n.start_time + n.duration for ch in melody.channels for n in ch.notes),
            default=16,
        )
        bars = max(1, int(total_beats / 4))

        rhythm = RhythmScore(
            bpm=effective_bpm,
            time_signature=melody.time_signature,
            bars=bars,
            pattern=[
                RhythmBeat(
                    beat=float(b * 4),
                    duration=4.0,
                    accent=b % 4 == 0,
                    type="bass" if b % 2 == 0 else "chord",
                )
                for b in range(bars)
            ],
        )

        logger.info(
            "composition_generated",
            title=melody.title,
            bars=bars,
        )
        return Composition(melody=melody, rhythm=rhythm)


def _distribute_bars(total: int, sections: int) -> list[int]:
    """Distribute bars across sections evenly."""
    if sections <= 0:
        return [total]
    base = total // sections
    remainder = total % sections
    result = [base] * sections
    for i in range(remainder):
        result[i] += 1
    return result
