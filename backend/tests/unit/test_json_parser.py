import pytest

from music_mcp.core.exceptions import InvalidModelResponseError
from music_mcp.utils.json_parser import parse_model_json


class TestParseModelJson:
    def test_clean_json_parsed_correctly(self):
        raw = '{"title": "Test", "bpm": 120}'
        result = parse_model_json(raw)
        assert result == {"title": "Test", "bpm": 120}

    def test_json_with_fence_removed(self):
        raw = '```json\n{"title": "Test", "bpm": 120}\n```'
        result = parse_model_json(raw)
        assert result == {"title": "Test", "bpm": 120}

    def test_json_with_fence_no_language_removed(self):
        raw = '```\n{"title": "Test", "bpm": 120}\n```'
        result = parse_model_json(raw)
        assert result == {"title": "Test", "bpm": 120}

    def test_json_with_inline_fence_removed(self):
        raw = '```json{"title": "Test", "bpm": 120}```'
        result = parse_model_json(raw)
        assert result == {"title": "Test", "bpm": 120}

    def test_empty_string_raises_error(self):
        with pytest.raises(InvalidModelResponseError):
            parse_model_json("")

    def test_invalid_json_raises_error(self):
        with pytest.raises(InvalidModelResponseError):
            parse_model_json("not json at all")

    def test_json_array_raises_error(self):
        with pytest.raises(InvalidModelResponseError):
            parse_model_json("[1, 2, 3]")

    def test_json_number_raises_error(self):
        with pytest.raises(InvalidModelResponseError):
            parse_model_json("42")

    def test_json_string_raises_error(self):
        with pytest.raises(InvalidModelResponseError):
            parse_model_json('"hello"')

    def test_whitespace_only_stripped_and_raises_error(self):
        with pytest.raises(InvalidModelResponseError):
            parse_model_json("   ")
