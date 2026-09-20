"""Running text CRUD."""

from fastapi import APIRouter, HTTPException

from lib.db import db
from models.schemas import RunningText, RunningTextCreate

router = APIRouter(prefix="/running-texts", tags=["running-texts"])


@router.get("", response_model=list[RunningText])
async def list_texts():
    docs = await db.running_texts.find().sort("order", 1).to_list(200)
    return [RunningText(**d) for d in docs]


@router.post("", response_model=RunningText)
async def create_text(input: RunningTextCreate):
    count = await db.running_texts.count_documents({})
    text = RunningText(**input.model_dump(), order=count)
    await db.running_texts.insert_one(text.model_dump())
    return text


@router.put("/{text_id}", response_model=RunningText)
async def update_text(text_id: str, input: RunningTextCreate):
    doc = await db.running_texts.find_one({"id": text_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Running text tidak ditemukan")
    merged = {**doc, **input.model_dump()}
    await db.running_texts.update_one({"id": text_id}, {"$set": merged})
    return RunningText(**merged)


@router.delete("/{text_id}")
async def delete_text(text_id: str):
    res = await db.running_texts.delete_one({"id": text_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Running text tidak ditemukan")
    return {"ok": True}
