import pytest
from pydantic import ValidationError

from music_mcp.models.music import (
    Adsr,
    Channel,
    ChannelRole,
    MusicScore,
    Note,
    RhythmBeat,
    RhythmScore,
    TimeSignature,
    Waveform,
)


class TestNote:
    def test_valid_note_passes_validation(self):
        note = Note(pitch="C", octave=4, start_time=0.0, duration=1.0, velocity=100)
        assert note.pitch == "C"
        assert note.octave == 4

    def test_pitch_with_sharp_passes(self):
        note = Note(pitch="C#", octave=4, start_time=0.0, duration=1.0, velocity=100)
        assert note.pitch == "C#"

    def test_pitch_with_flat_passes(self):
        note = Note(pitch="Eb", octave=4, start_time=0.0, duration=1.0, velocity=100)
        assert note.pitch == "Eb"

    def test_invalid_pitch_raises_error(self):
        with pytest.raises(ValidationError):
            Note(pitch="H", octave=4, start_time=0.0, duration=1.0, velocity=100)

    def test_pitch_with_double_sharp_raises_error(self):
        with pytest.raises(ValidationError):
            Note(pitch="C##", octave=4, start_time=0.0, duration=1.0, velocity=100)

    def test_velocity_below_1_raises_error(self):
        with pytest.raises(ValidationError):
            Note(pitch="C", octave=4, start_time=0.0, duration=1.0, velocity=0)

    def test_velocity_above_127_raises_error(self):
        with pytest.raises(ValidationError):
            Note(pitch="C", octave=4, start_time=0.0, duration=1.0, velocity=128)

    def test_octave_below_2_raises_error(self):
        with pytest.raises(ValidationError):
            Note(pitch="C", octave=1, start_time=0.0, duration=1.0, velocity=100)

    def test_octave_above_7_raises_error(self):
        with pytest.raises(ValidationError):
            Note(pitch="C", octave=8, start_time=0.0, duration=1.0, velocity=100)

    def test_negative_start_time_raises_error(self):
        with pytest.raises(ValidationError):
            Note(pitch="C", octave=4, start_time=-1.0, duration=1.0, velocity=100)

    def test_zero_duration_raises_error(self):
        with pytest.raises(ValidationError):
            Note(pitch="C", octave=4, start_time=0.0, duration=0.0, velocity=100)

    def test_negative_duration_raises_error(self):
        with pytest.raises(ValidationError):
            Note(pitch="C", octave=4, start_time=0.0, duration=-1.0, velocity=100)


class TestAdsr:
    def test_valid_adsr_passes(self):
        adsr = Adsr(attack=0.01, decay=0.1, sustain=0.7, release=0.3)
        assert adsr.attack == 0.01

    def test_attack_below_minimum_raises_error(self):
        with pytest.raises(ValidationError):
            Adsr(attack=0.0001, decay=0.1, sustain=0.7, release=0.3)

    def test_sustain_above_1_raises_error(self):
        with pytest.raises(ValidationError):
            Adsr(attack=0.01, decay=0.1, sustain=1.5, release=0.3)


class TestChannel:
    def test_valid_channel_passes(self):
        note = Note(pitch="C", octave=4, start_time=0.0, duration=1.0, velocity=100)
        adsr = Adsr(attack=0.01, decay=0.1, sustain=0.7, release=0.3)
        channel = Channel(
            id=ChannelRole.MELODY,
            name="Melody",
            waveform=Waveform.SINE,
            adsr=adsr,
            notes=[note],
        )
        assert channel.id == ChannelRole.MELODY

    def test_empty_notes_raises_error(self):
        adsr = Adsr(attack=0.01, decay=0.1, sustain=0.7, release=0.3)
        with pytest.raises(ValidationError):
            Channel(
                id=ChannelRole.MELODY,
                name="Melody",
                waveform=Waveform.SINE,
                adsr=adsr,
                notes=[],
            )


class TestMusicScore:
    def test_valid_score_passes(self):
        note = Note(pitch="C", octave=4, start_time=0.0, duration=1.0, velocity=100)
        adsr = Adsr(attack=0.01, decay=0.1, sustain=0.7, release=0.3)
        channel = Channel(
            id=ChannelRole.MELODY,
            name="Melody",
            waveform=Waveform.SINE,
            adsr=adsr,
            notes=[note],
        )
        score = MusicScore(
            title="Test Song",
            bpm=120,
            key="C",
            time_signature=TimeSignature.FOUR_FOUR,
            channels=[channel],
        )
        assert score.title == "Test Song"

    def test_empty_channels_raises_error(self):
        with pytest.raises(ValidationError):
            MusicScore(
                title="Test Song",
                bpm=120,
                key="C",
                time_signature=TimeSignature.FOUR_FOUR,
                channels=[],
            )

    def test_bpm_below_40_raises_error(self):
        note = Note(pitch="C", octave=4, start_time=0.0, duration=1.0, velocity=100)
        adsr = Adsr(attack=0.01, decay=0.1, sustain=0.7, release=0.3)
        channel = Channel(
            id=ChannelRole.MELODY,
            name="Melody",
            waveform=Waveform.SINE,
            adsr=adsr,
            notes=[note],
        )
        with pytest.raises(ValidationError):
            MusicScore(
                title="Test Song",
                bpm=30,
                key="C",
                time_signature=TimeSignature.FOUR_FOUR,
                channels=[channel],
            )

    def test_bpm_above_240_raises_error(self):
        note = Note(pitch="C", octave=4, start_time=0.0, duration=1.0, velocity=100)
        adsr = Adsr(attack=0.01, decay=0.1, sustain=0.7, release=0.3)
        channel = Channel(
            id=ChannelRole.MELODY,
            name="Melody",
            waveform=Waveform.SINE,
            adsr=adsr,
            notes=[note],
        )
        with pytest.raises(ValidationError):
            MusicScore(
                title="Test Song",
                bpm=300,
                key="C",
                time_signature=TimeSignature.FOUR_FOUR,
                channels=[channel],
            )


class TestRhythmBeat:
    def test_valid_beat_passes(self):
        beat = RhythmBeat(beat=0.0, duration=0.5, accent=True, type="bass")
        assert beat.type == "bass"

    def test_invalid_type_raises_error(self):
        with pytest.raises(ValidationError):
            RhythmBeat(beat=0.0, duration=0.5, accent=True, type="invalid")


class TestRhythmScore:
    def test_valid_rhythm_passes(self):
        beat = RhythmBeat(beat=0.0, duration=0.5, accent=True, type="bass")
        rhythm = RhythmScore(
            bpm=120,
            time_signature=TimeSignature.FOUR_FOUR,
            bars=2,
            pattern=[beat],
        )
        assert rhythm.bpm == 120

    def test_bars_must_be_positive(self):
        beat = RhythmBeat(beat=0.0, duration=0.5, accent=True, type="bass")
        with pytest.raises(ValidationError):
            RhythmScore(
                bpm=120,
                time_signature=TimeSignature.FOUR_FOUR,
                bars=0,
                pattern=[beat],
            )
