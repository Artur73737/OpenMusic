import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from music_mcp.models.music import Composition


class Database:
    """SQLite database for session persistence."""

    def __init__(self, db_path: str | Path = "music_mcp.db") -> None:
        self._db_path = Path(db_path)
        self._init_db()

    @contextmanager
    def _get_connection(self) -> Generator[sqlite3.Connection, None, None]:
        """Get database connection with row factory."""
        conn = sqlite3.connect(self._db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def _init_db(self) -> None:
        """Initialize database schema."""
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL,
                    composition TEXT NOT NULL,
                    messages TEXT NOT NULL
                )
            """)

            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_sessions_updated 
                ON sessions(updated_at DESC)
            """)

    def save_session(
        self,
        session_id: str,
        title: str,
        created_at: int,
        updated_at: int,
        composition: Composition,
        messages: list[dict],
    ) -> None:
        """Save or update a session."""
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO sessions (id, title, created_at, updated_at, composition, messages)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    title = excluded.title,
                    updated_at = excluded.updated_at,
                    composition = excluded.composition,
                    messages = excluded.messages
            """,
                (
                    session_id,
                    title,
                    created_at,
                    updated_at,
                    composition.model_dump_json(),
                    json.dumps(messages),
                ),
            )

    def get_session(self, session_id: str) -> dict | None:
        """Retrieve a session by ID."""
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM sessions WHERE id = ?",
                (session_id,),
            ).fetchone()

            if row is None:
                return None

            return {
                "id": row["id"],
                "title": row["title"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
                "composition": json.loads(row["composition"]),
                "messages": json.loads(row["messages"]),
            }

    def list_sessions(self, limit: int = 50) -> list[dict]:
        """List all sessions ordered by update time."""
        with self._get_connection() as conn:
            rows = conn.execute(
                """
                SELECT id, title, created_at, updated_at 
                FROM sessions 
                ORDER BY updated_at DESC 
                LIMIT ?
            """,
                (limit,),
            ).fetchall()

            return [
                {
                    "id": row["id"],
                    "title": row["title"],
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                }
                for row in rows
            ]

    def delete_session(self, session_id: str) -> bool:
        """Delete a session. Returns True if deleted."""
        with self._get_connection() as conn:
            cursor = conn.execute(
                "DELETE FROM sessions WHERE id = ?",
                (session_id,),
            )
            return cursor.rowcount > 0
