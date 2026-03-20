import structlog

import httpx

from music_mcp.config import Settings
from music_mcp.core.exceptions import NvidiaApiError, NvidiaTimeoutError

logger = structlog.get_logger()


class NvidiaClient:
    def __init__(self, settings: Settings) -> None:
        self._base_url = settings.nvidia_base_url
        self._api_key = settings.nvidia_api_key
        self._timeout = settings.nvidia_timeout_seconds
        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
            },
            timeout=httpx.Timeout(self._timeout),
        )

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        model: str | None = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
        top_p: float = 0.9,
    ) -> str:
        model = model or "meta/llama-3.1-70b-instruct"

        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": top_p,
            "stream": False,
        }

        logger.debug("nvidia_chat_request", model=model, message_count=len(messages))

        try:
            response = await self._client.post("/chat/completions", json=payload)

            if response.status_code != 200:
                body = response.text[:500]
                logger.error("nvidia_api_error", status_code=response.status_code, body=body)
                raise NvidiaApiError(response.status_code, body)

            data = response.json()
            content = data["choices"][0]["message"]["content"]

            logger.debug(
                "nvidia_chat_response",
                model=model,
                response_length=len(content),
            )

            return content

        except httpx.TimeoutException as e:
            logger.error("nvidia_timeout", timeout_seconds=self._timeout)
            raise NvidiaTimeoutError(self._timeout) from e

    async def aclose(self) -> None:
        await self._client.aclose()
