"""Prayer settings (method/corrections/manual) + server-computed prayer times."""

from datetime import date as date_cls

from fastapi import APIRouter, HTTPException

from lib.db import db
from lib.dates import today_iso
from lib.hijri import format_gregorian_id, hijri_from_date
from lib.prayer import compute_times
from models.schemas import PrayerSettings, PrayerTimesOut

router = APIRouter(tags=["prayer"])


async def _settings() -> dict:
    doc = await db.prayer_settings.find_one({"id": "singleton"})
    if not doc:
        doc = PrayerSettings().model_dump()
        await db.prayer_settings.insert_one(doc)
    return doc


@router.get("/prayer-settings", response_model=PrayerSettings)
async def get_prayer_settings():
    return await _settings()


@router.put("/prayer-settings", response_model=PrayerSettings)
async def put_prayer_settings(input: PrayerSettings):
    input.id = "singleton"
    await db.prayer_settings.update_one(
        {"id": "singleton"}, {"$set": input.model_dump()}, upsert=True
    )
    return input


@router.get("/prayer-times", response_model=PrayerTimesOut)
async def get_prayer_times(date: str | None = None):
    """Computed times for ?date=YYYY-MM-DD (default: today in the mosque timezone)."""
    settings = await _settings()
    mosque = await db.mosque.find_one({"id": "singleton"}) or {}
    tz = mosque.get("timezone", "Asia/Jakarta")
    lat = float(mosque.get("latitude", -6.1754))
    lng = float(mosque.get("longitude", 106.8272))
    if date:
        try:
            d = date_cls.fromisoformat(date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Format tanggal harus YYYY-MM-DD")
    else:
        d = date_cls.fromisoformat(today_iso(tz))
    times = compute_times(
        d, lat, lng, tz,
        settings.get("method", "KEMENAG"),
        settings.get("asr_method", "STANDARD"),
        settings.get("corrections") or {},
        settings.get("manual_times") or {},
    )
    return PrayerTimesOut(
        date=d.isoformat(),
        source="manual" if settings.get("method") == "MANUAL" else "auto",
        times=times,
        hijri=hijri_from_date(d),
        gregorian_formatted=format_gregorian_id(d),
    )
