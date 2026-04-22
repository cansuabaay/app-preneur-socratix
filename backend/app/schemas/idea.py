from typing import List
 
from pydantic import BaseModel, Field
 
 
class IdeaCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=2000)
 
 
class IdeaResponse(BaseModel):
    id: int
    title: str
    description: str
    votes: int
    status: str
    created_at: str
    ai_suggestions: List = []