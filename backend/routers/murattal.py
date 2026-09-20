"""Scheduled murattal windows CRUD."""

from fastapi import APIRouter, HTTPException

from lib.db import db
from models.schemas import MurattalCreate, MurattalSchedule

router = APIRouter(prefix="/murattal", tags=["murattal"])


@router.get("", response_model=list[MurattalSchedule])
async def list_schedules():
    docs = await db.murattal.find().sort("start_time", 1).to_list(200)
    return [MurattalSchedule(**d) for d in docs]


@router.post("", response_model=MurattalSchedule)
async def create_schedule(input: MurattalCreate):
    schedule = MurattalSchedule(**input.model_dump())
    await db.murattal.insert_one(schedule.model_dump())
    return schedule


@router.put("/{schedule_id}", response_model=MurattalSchedule)
async def update_schedule(schedule_id: str, input: MurattalCreate):
    doc = await db.murattal.find_one({"id": schedule_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Jadwal murattal tidak ditemukan")
    merged = {**doc, **input.model_dump()}
    await db.murattal.update_one({"id": schedule_id}, {"$set": merged})
    return MurattalSchedule(**merged)


@router.delete("/{schedule_id}")
async def delete_schedule(schedule_id: str):
    res = await db.murattal.delete_one({"id": schedule_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Jadwal murattal tidak ditemukan")
    return {"ok": True}
