"""Database configuration and connection"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
import os
from typing import Generator

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://welfare:welfare123@localhost:5432/welfare_db"
)

# Create engine with connection pooling for production
engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    poolclass=NullPool if os.getenv("ENVIRONMENT") == "testing" else None,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db() -> Generator[Session, None, None]:
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database (create all tables)"""
    from src.models import Base
    Base.metadata.create_all(bind=engine)
    print("✓ Database initialized")


def drop_db():
    """Drop all tables (for testing)"""
    from src.models import Base
    Base.metadata.drop_all(bind=engine)
    print("✓ Database dropped")
