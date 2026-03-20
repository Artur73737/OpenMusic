import pytest
from unittest.mock import AsyncMock

from music_mcp.core.exceptions import InvalidModelResponseError, NvidiaApiError
from music_mcp.models.music import Composition, MusicScore, RhythmScore
from music_mcp.services.composition_service import CompositionService
from music_mcp.services.nvidia_client import NvidiaClient


class TestCompositionService:
    @pytest.fixture
    def mock_client(self):
        client = AsyncMock(spec=NvidiaClient)
        return client

    @pytest.fixture
    def valid_melody_json(self):
        return """{
            "title": "Test Song",
            "bpm": 120,
            "key": "C",
            "time_signature": "4/4",
            "channels": [
                {
                    "id": "melody",
                    "name": "Melody",
                    "waveform": "sine",
                    "adsr": {"attack": 0.01, "decay": 0.1, "sustain": 0.7, "release": 0.3},
                    "notes": [
                        {"pitch": "C", "octave": 4, "start_time": 0.0, "duration": 1.0, "velocity": 100}
                    ]
                },
                {
                    "id": "bass",
                    "name": "Bass",
                    "waveform": "triangle",
                    "adsr": {"attack": 0.01, "decay": 0.1, "sustain": 0.7, "release": 0.3},
                    "notes": [
                        {"pitch": "C", "octave": 2, "start_time": 0.0, "duration": 1.0, "velocity": 80}
                    ]
                },
                {
                    "id": "chords",
                    "name": "Chords",
                    "waveform": "square",
                    "adsr": {"attack": 0.01, "decay": 0.1, "sustain": 0.7, "release": 0.3},
                    "notes": [
                        {"pitch": "C", "octave": 4, "start_time": 0.0, "duration": 1.0, "velocity": 60},
                        {"pitch": "E", "octave": 4, "start_time": 0.0, "duration": 1.0, "velocity": 60},
                        {"pitch": "G", "octave": 4, "start_time": 0.0, "duration": 1.0, "velocity": 60}
                    ]
                }
            ]
        }"""

    @pytest.fixture
    def valid_rhythm_json(self):
        return """{
            "bpm": 120,
            "time_signature": "4/4",
            "bars": 2,
            "pattern": [
                {"beat": 0.0, "duration": 0.5, "accent": true, "type": "bass"},
                {"beat": 0.5, "duration": 0.5, "accent": false, "type": "chord"}
            ]
        }"""

    @pytest.mark.asyncio
    async def test_generate_melody_with_valid_response_returns_score(self, mock_client, valid_melody_json):
        mock_client.chat.return_value = valid_melody_json
        service = CompositionService(mock_client)

        result = await service.generate_melody("test prompt")

        assert isinstance(result, MusicScore)
        assert result.title == "Test Song"
        assert len(result.channels) == 3
        mock_client.chat.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_melody_with_invalid_json_raises_error(self, mock_client):
        mock_client.chat.return_value = "not valid json"
        service = CompositionService(mock_client)

        with pytest.raises(InvalidModelResponseError):
            await service.generate_melody("test prompt")

    @pytest.mark.asyncio
    async def test_generate_melody_with_api_error_raises_nvidia_error(self, mock_client):
        mock_client.chat.side_effect = NvidiaApiError(500, "Internal Server Error")
        service = CompositionService(mock_client)

        with pytest.raises(NvidiaApiError):
            await service.generate_melody("test prompt")

    @pytest.mark.asyncio
    async def test_generate_rhythm_with_valid_response_returns_score(self, mock_client, valid_rhythm_json):
        mock_client.chat.return_value = valid_rhythm_json
        service = CompositionService(mock_client)

        result = await service.generate_rhythm("test prompt")

        assert isinstance(result, RhythmScore)
        assert result.bpm == 120
        mock_client.chat.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_composition_calls_chat_twice(self, mock_client, valid_melody_json, valid_rhythm_json):
        mock_client.chat.side_effect = [valid_melody_json, valid_rhythm_json]
        service = CompositionService(mock_client)

        result = await service.generate_composition("test prompt")

        assert isinstance(result, Composition)
        assert result.melody.title == "Test Song"
        assert result.rhythm.bpm == 120
        assert mock_client.chat.call_count == 2

    @pytest.mark.asyncio
    async def test_generate_composition_with_valid_response_returns_both(
        self, mock_client, valid_melody_json, valid_rhythm_json
    ):
        mock_client.chat.side_effect = [valid_melody_json, valid_rhythm_json]
        service = CompositionService(mock_client)

        result = await service.generate_composition("test prompt")

        assert isinstance(result.melody, MusicScore)
        assert isinstance(result.rhythm, RhythmScore)
