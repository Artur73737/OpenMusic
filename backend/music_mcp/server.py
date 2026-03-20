import asyncio
import sys

import structlog
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

from music_mcp.config.settings import Settings, get_settings
from music_mcp.core.exceptions import MusicMcpError
from music_mcp.services.composition_service import CompositionService
from music_mcp.services.nvidia_client import NvidiaClient

logger = structlog.get_logger()


def configure_logging(log_level: str) -> None:
    """Configure structured JSON logging to stderr."""
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def create_server(settings: Settings) -> tuple[Server, NvidiaClient]:
    """Create and configure MCP server with tools."""
    server = Server(settings.mcp_server_name)
    client = NvidiaClient(settings)
    service = CompositionService(client)

    @server.list_tools()
    async def list_tools() -> list[Tool]:
        """Return list of available tools."""
        return [
            Tool(
                name="generate_melody",
                description="Generate a polyphonic piano melody with bass and chords from a text description. Returns JSON with MusicScore schema containing channels for melody, bass, and chords.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "prompt": {
                            "type": "string",
                            "description": "Text description of desired music (e.g., 'jazz nocturne in Eb minor, 90 bpm')",
                        },
                        "model": {
                            "type": "string",
                            "description": "Optional NVIDIA model identifier (defaults to meta/llama-3.1-70b-instruct)",
                        },
                    },
                    "required": ["prompt"],
                },
            ),
            Tool(
                name="generate_rhythm",
                description="Generate a rhythmic pattern from a text description. Returns JSON with RhythmScore schema containing BPM, time signature, and beat pattern.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "prompt": {
                            "type": "string",
                            "description": "Text description of desired rhythm (e.g., 'swing jazz rhythm, 4/4 time')",
                        },
                        "model": {
                            "type": "string",
                            "description": "Optional NVIDIA model identifier",
                        },
                    },
                    "required": ["prompt"],
                },
            ),
            Tool(
                name="generate_composition",
                description="Generate a complete musical composition with both melody and rhythm in parallel. Returns JSON with Composition schema containing MusicScore and RhythmScore.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "prompt": {
                            "type": "string",
                            "description": "Text description of desired music",
                        },
                        "model": {
                            "type": "string",
                            "description": "Optional NVIDIA model identifier",
                        },
                    },
                    "required": ["prompt"],
                },
            ),
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict) -> list[TextContent]:
        """Handle tool invocations."""
        prompt = arguments.get("prompt", "")
        model = arguments.get("model")

        logger.info(
            "Tool called",
            tool=name,
            prompt_length=len(prompt),
            model=model,
        )

        try:
            if name == "generate_melody":
                result = await service.generate_melody(prompt, model)
                return [TextContent(type="text", text=result.model_dump_json())]
            elif name == "generate_rhythm":
                result = await service.generate_rhythm(prompt, model)
                return [TextContent(type="text", text=result.model_dump_json())]
            elif name == "generate_composition":
                result = await service.generate_composition(prompt, model)
                return [TextContent(type="text", text=result.model_dump_json())]
            else:
                return [TextContent(type="text", text=f"Unknown tool: {name}")]
        except MusicMcpError as e:
            logger.error("Tool execution failed", tool=name, error=e.message)
            return [TextContent(type="text", text=f"Error: {e.message}")]

    return server, client


async def _run() -> None:
    """Main entry point for the MCP server."""
    settings = get_settings()
    configure_logging(settings.log_level)

    logger.info(
        "Starting Music MCP server",
        name=settings.mcp_server_name,
        version=settings.mcp_server_version,
    )

    server, client = create_server(settings)

    try:
        async with stdio_server() as (read_stream, write_stream):
            await server.run(
                read_stream,
                write_stream,
                server.create_initialization_options(),
            )
    finally:
        await client.aclose()
        logger.info("Server shut down")


def main() -> None:
    """Entry point for the music-mcp script."""
    asyncio.run(_run())


if __name__ == "__main__":
    main()
