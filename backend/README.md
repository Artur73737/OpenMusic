# Music MCP Server

MCP server for AI-generated polyphonic piano compositions using NVIDIA Build API.

## Installation

```bash
uv install
```

## Usage

```bash
uv run music-mcp
```

## Environment Variables

- `NVIDIA_API_KEY` - Required NVIDIA Build API key
- `NVIDIA_BASE_URL` - API base URL (default: https://integrate.api.nvidia.com/v1)
- `NVIDIA_DEFAULT_MODEL` - Default model (default: meta/llama-3.1-70b-instruct)

## Tools

- `generate_melody` - Generate polyphonic melody with bass and chords
- `generate_rhythm` - Generate rhythmic pattern
- `generate_composition` - Generate complete composition (melody + rhythm)
