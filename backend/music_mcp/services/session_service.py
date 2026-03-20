import uuid
import structlog
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from music_mcp.core.exceptions import SessionNotFoundError
from music_mcp.models.db import Message, Session
from music_mcp.models.music import Composition

logger = structlog.get_logger()


class SessionService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create_session(self, title: str) -> Session:
        session = Session(id=str(uuid.uuid4()), title=title)
        self._db.add(session)
        await self._db.flush()
        await self._db.refresh(session)

        logger.info("session_created", session_id=session.id, title=title)
        return session

    async def get_session(self, session_id: str) -> Session:
        result = await self._db.execute(select(Session).where(Session.id == session_id))
        session = result.scalar_one_or_none()

        if session is None:
            raise SessionNotFoundError(session_id)

        return session

    async def list_sessions(self, limit: int = 50, offset: int = 0) -> list[Session]:
        result = await self._db.execute(select(Session).order_by(Session.updated_at.desc()).limit(limit).offset(offset))
        return list(result.scalars().all())

    async def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        composition: Composition | None = None,
    ) -> Message:
        composition_json = composition.model_dump() if composition else None

        message = Message(
            id=str(uuid.uuid4()),
            session_id=session_id,
            role=role,
            content=content,
            composition_json=composition_json,
        )

        self._db.add(message)
        await self._db.flush()
        await self._db.refresh(message)

        logger.info("message_added", session_id=session_id, role=role, has_composition=composition is not None)
        return message

    async def get_messages(self, session_id: str) -> list[Message]:
        result = await self._db.execute(
            select(Message).where(Message.session_id == session_id).order_by(Message.created_at.asc())
        )
        return list(result.scalars().all())

    async def delete_session(self, session_id: str) -> None:
        session = await self.get_session(session_id)
        await self._db.delete(session)
        logger.info("session_deleted", session_id=session_id)
