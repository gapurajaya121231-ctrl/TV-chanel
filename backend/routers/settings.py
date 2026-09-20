"""General display settings (slideshow, visibility toggles)."""

from fastapi import APIRouter

from lib.db import db
from models.schemas import GeneralSettings

router = APIRouter(prefix="/settings", tags=["settings"])


async def _get_or_create() -> dict:
    doc = await db.settings.find_one({"id": "singleton"})
    if not doc:
        doc = GeneralSettings().model_dump()
        await db.settings.insert_one(doc)
    return doc


@router.get("", response_model=GeneralSettings)
async def get_settings():
    return await _get_or_create()


@router.put("", response_model=GeneralSettings)
async def update_settings(input: GeneralSettings):
    input.id = "singleton"
    await db.settings.update_one(
        {"id": "singleton"}, {"$set": input.model_dump()}, upsert=True
    )
    return input
