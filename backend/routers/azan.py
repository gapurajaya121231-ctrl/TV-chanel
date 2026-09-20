"""Azan screen settings (single doc)."""

from fastapi import APIRouter

from lib.db import db
from models.schemas import AzanSettings

router = APIRouter(prefix="/azan-settings", tags=["azan"])


async def _get_or_create() -> dict:
    doc = await db.azan_settings.find_one({"id": "singleton"})
    if not doc:
        doc = AzanSettings().model_dump()
        await db.azan_settings.insert_one(doc)
    return doc


@router.get("", response_model=AzanSettings)
async def get_azan_settings():
    return await _get_or_create()


@router.put("", response_model=AzanSettings)
async def update_azan_settings(input: AzanSettings):
    input.id = "singleton"
    await db.azan_settings.update_one(
        {"id": "singleton"}, {"$set": input.model_dump()}, upsert=True
    )
    return input
