from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB

# JSONB on PostgreSQL; standard JSON on SQLite (tests) and other dialects.
FlexibleJSON = JSONB().with_variant(JSON(), "sqlite")
