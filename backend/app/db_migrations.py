from sqlalchemy import inspect, text

from app.database import engine


def run_lightweight_migrations() -> None:
    """Add columns introduced after initial deploy (no Alembic in this project)."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("users")}
    statements: list[str] = []

    if "avatarUrl" not in columns:
        statements.append('ALTER TABLE users ADD COLUMN "avatarUrl" VARCHAR(500)')
    if "bio" not in columns:
        statements.append("ALTER TABLE users ADD COLUMN bio TEXT")

    if not statements:
        return

    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))
