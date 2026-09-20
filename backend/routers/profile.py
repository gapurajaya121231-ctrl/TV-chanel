"""Mosque profile + localization (single doc, upsert)."""

from fastapi import APIRouter

from lib.db import db
from models.schemas import MosqueProfile

router = APIRouter(prefix="/mosque", tags=["mosque"])


async def _get_or_create() -> dict:
    doc = await db.mosque.find_one({"id": "singleton"})
    if not doc:
        doc = MosqueProfile().model_dump()
        await db.mosque.insert_one(doc)
    return doc


@router.get("", response_model=MosqueProfile)
async def get_mosque():
    return await _get_or_create()


@router.put("", response_model=MosqueProfile)
async def update_mosque(input: MosqueProfile):
    input.id = "singleton"
    await db.mosque.update_one(
        {"id": "singleton"}, {"$set": input.model_dump()}, upsert=True
    )
    return input
