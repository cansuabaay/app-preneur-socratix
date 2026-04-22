from dataclasses import dataclass, field
from datetime import datetime
 
 
@dataclass
class Idea:
    id: int
    title: str
    description: str
    votes: int = 0
    status: str = "yeni"
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    ai_suggestions: list = field(default_factory=list)
