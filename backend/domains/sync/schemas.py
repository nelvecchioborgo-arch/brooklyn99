"""
Sync domain schemas.
Aggregate response model for the daily sync endpoint.
"""
from __future__ import annotations

from datetime import date
from typing import List, Optional

from pydantic import BaseModel

from backend.domains.categories.schemas import CategoryResponse
from backend.domains.countdowns.schemas import CountdownResponse
from backend.domains.events.schemas import EventResponse
from backend.domains.habits.schemas import HabitResponse
from backend.domains.planning.schemas import DailyEntryResponse
from backend.domains.shopping.schemas import ShoppingListResponse
from backend.domains.tasks.schemas import TaskResponse


class SyncDayResponse(BaseModel):
    """
    Risposta aggregata per /sync/day.
    Contiene tutti i dati necessari al frontend in una singola richiesta.
    """

    data_riferimento: date
    obiettivo: Optional[DailyEntryResponse] = None
    priorita: List[DailyEntryResponse] = []
    note: List[DailyEntryResponse] = []
    tasks: List[TaskResponse] = []
    events: List[EventResponse] = []
    habits: List[HabitResponse] = []
    categories: List[CategoryResponse] = []
    shopping_lists: List[ShoppingListResponse] = []
    countdowns: List[CountdownResponse] = []


__all__ = [
    "SyncDayResponse",
    "DailyEntryResponse",
]
