class MusicMcpError(Exception):
    @property
    def message(self) -> str:
        return str(self.args[0]) if self.args else ""


class NvidiaApiError(MusicMcpError):
    def __init__(self, status_code: int, body: str) -> None:
        self.status_code = status_code
        self.body = body
        super().__init__(f"NVIDIA API error {status_code}: {body}")


class NvidiaTimeoutError(MusicMcpError):
    def __init__(self, timeout_seconds: int) -> None:
        self.timeout_seconds = timeout_seconds
        super().__init__(f"NVIDIA API request timed out after {timeout_seconds} seconds")


class InvalidModelResponseError(MusicMcpError):
    def __init__(self, message: str, raw_response: str | None = None) -> None:
        self.raw_response = raw_response
        super().__init__(message)


class MissingApiKeyError(MusicMcpError):
    def __init__(self) -> None:
        super().__init__("NVIDIA_API_KEY is required but not provided")


class SessionNotFoundError(MusicMcpError):
    def __init__(self, session_id: str) -> None:
        self.session_id = session_id
        super().__init__(f"Session not found: {session_id}")
