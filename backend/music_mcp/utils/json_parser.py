import json
import re

from music_mcp.core.exceptions import InvalidModelResponseError


def parse_model_json(raw: str) -> dict:
    if not raw:
        raise InvalidModelResponseError("Empty response from model", raw)

    cleaned = raw.strip()

    fence_patterns = [
        r"^```json\s*\n",
        r"^```\s*\n",
        r"\n```\s*$",
        r"```json\s*",
        r"```",
    ]

    for pattern in fence_patterns:
        cleaned = re.sub(pattern, "", cleaned)

    cleaned = cleaned.strip()

    try:
        result = json.loads(cleaned)
        if not isinstance(result, dict):
            raise InvalidModelResponseError(f"Expected JSON object, got {type(result).__name__}", raw)
        return result
    except json.JSONDecodeError as e:
        raise InvalidModelResponseError(f"Invalid JSON: {e.msg}", raw) from e
