"""Islamic events CRUD."""

from fastapi import APIRouter, HTTPException

from lib.db import db
from models.schemas import IslamicEvent, IslamicEventCreate

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[IslamicEvent])
async def list_events():
    docs = await db.events.find().sort([("date", 1), ("time", 1)]).to_list(200)
    return [IslamicEvent(**d) for d in docs]


@router.post("", response_model=IslamicEvent)
async def create_event(input: IslamicEventCreate):
    event = IslamicEvent(**input.model_dump())
    await db.events.insert_one(event.model_dump())
    return event


@router.put("/{event_id}", response_model=IslamicEvent)
async def update_event(event_id: str, input: IslamicEventCreate):
    doc = await db.events.find_one({"id": event_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Kegiatan tidak ditemukan")
    merged = {**doc, **input.model_dump()}
    await db.events.update_one({"id": event_id}, {"$set": merged})
    return IslamicEvent(**merged)


@router.delete("/{event_id}")
async def delete_event(event_id: str):
    res = await db.events.delete_one({"id": event_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kegiatan tidak ditemukan")
    return {"ok": True}
