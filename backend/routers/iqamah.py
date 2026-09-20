"""Iqamah settings: per-prayer offsets in minutes (single doc)."""

from fastapi import APIRouter

from lib.db import db
from lib.prayer import AZAN_KEYS
from models.schemas import IqamahSettings

router = APIRouter(prefix="/iqamah-settings", tags=["iqamah"])

DEFAULT_OFFSETS = {key: 10 for key in AZAN_KEYS}


async def _get_or_create() -> dict:
    doc = await db.iqamah_settings.find_one({"id": "singleton"})
    if not doc:
        doc = IqamahSettings(offsets=dict(DEFAULT_OFFSETS)).model_dump()
        await db.iqamah_settings.insert_one(doc)
    return doc


@router.get("", response_model=IqamahSettings)
async def get_iqamah_settings():
    return await _get_or_create()


@router.put("", response_model=IqamahSettings)
async def update_iqamah_settings(input: IqamahSettings):
    input.id = "singleton"
    for key in AZAN_KEYS:  # keep every prayer keyed even if the client trimmed it
        input.offsets.setdefault(key, 10)
    await db.iqamah_settings.update_one(
        {"id": "singleton"}, {"$set": input.model_dump()}, upsert=True
    )
    return input
