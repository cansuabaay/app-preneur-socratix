from sqlalchemy import inspect, text

from app.constants.innovation_roles import DEFAULT_INNOVATION_ROLE
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
    if "jobTitle" not in columns:
        statements.append('ALTER TABLE users ADD COLUMN "jobTitle" VARCHAR(120)')
    if "innovationRole" not in columns:
        statements.append(
            f'ALTER TABLE users ADD COLUMN "innovationRole" VARCHAR(50) '
            f"DEFAULT '{DEFAULT_INNOVATION_ROLE}'"
        )

    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))

    if "ideas" in inspector.get_table_names():
        idea_columns = {col["name"] for col in inspector.get_columns("ideas")}
        idea_statements: list[str] = []
        if "strategicAnalysis" not in idea_columns:
            json_type = "JSONB" if engine.dialect.name == "postgresql" else "JSON"
            idea_statements.append(
                f'ALTER TABLE ideas ADD COLUMN "strategicAnalysis" {json_type}'
            )
        with engine.begin() as conn:
            for stmt in idea_statements:
                conn.execute(text(stmt))

    columns = {col["name"] for col in inspect(engine).get_columns("users")}
    if "innovationRole" in columns:
        with engine.begin() as conn:
            conn.execute(
                text(
                    'UPDATE users SET "innovationRole" = :default_role '
                    'WHERE "innovationRole" IS NULL OR TRIM("innovationRole") = \'\''
                ),
                {"default_role": DEFAULT_INNOVATION_ROLE},
            )
