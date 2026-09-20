"""Aggregated payload for the TV /display page — one call returns everything
the active layout needs (mosque, times, layout config, slides, texts, settings)."""

from datetime import date as date_cls

from fastapi import APIRouter

from lib.db import db
from lib.dates import today_iso
from lib.hijri import format_gregorian_id, hijri_from_date
from lib.prayer import compute_times
from models.schemas import (
    AzanSettings,
    DonationSlide,
    DisplayPayload,
    GeneralSettings,
    InfoSlide,
    IqamahSettings,
    IslamicEvent,
    Layout,
    MosqueProfile,
    MurattalSchedule,
    PrayerSettings,
    PrayerTimesOut,
    RunningText,
    SliderImage,
)

router = APIRouter(tags=["display"])


@router.get("/display", response_model=DisplayPayload)
async def get_display():
    mosque = MosqueProfile(**(await db.mosque.find_one({"id": "singleton"}) or {}))
    ps = PrayerSettings(**(await db.prayer_settings.find_one({"id": "singleton"}) or {}))
    tz = mosque.timezone
    today = today_iso(tz)
    d = date_cls.fromisoformat(today)
    times = compute_times(
        d, mosque.latitude, mosque.longitude, tz,
        ps.method, ps.asr_method, ps.corrections, ps.manual_times,
    )
    prayer_times = PrayerTimesOut(
        date=today,
        source="manual" if ps.method == "MANUAL" else "auto",
        times=times,
        hijri=hijri_from_date(d),
        gregorian_formatted=format_gregorian_id(d),
    )

    layout_doc = await db.layouts.find_one({"is_active": True})
    if not layout_doc:
        first = await db.layouts.find_one()
        if not first:
            first = {"key": "signature", "name": "SIGNATURE", "description": "", "config": {}}
        first.setdefault("is_active", True)
        layout = Layout(**first)
    else:
        layout = Layout(**layout_doc)

    slides = [SliderImage(**s) for s in await db.slider_images.find().sort([("is_utama", -1), ("order", 1)]).to_list(100)]
    info = [InfoSlide(**s) for s in await db.info_slides.find({"is_active": True}).sort("order", 1).to_list(50)]
    don_doc = await db.donation.find_one({"id": "singleton"})
    donation = DonationSlide(**don_doc) if don_doc else None
    events = [IslamicEvent(**e) for e in await db.events.find({"date": {"$gte": today}}).sort([("date", 1), ("time", 1)]).to_list(50)]
    running = [RunningText(**r) for r in await db.running_texts.find({"is_active": True}).sort("order", 1).to_list(50)]
    azan = AzanSettings(**(await db.azan_settings.find_one({"id": "singleton"}) or {}))
    iqamah = IqamahSettings(**(await db.iqamah_settings.find_one({"id": "singleton"}) or {}))
    murattal = [MurattalSchedule(**m) for m in await db.murattal.find({"enabled": True}).sort("start_time", 1).to_list(50)]
    settings = GeneralSettings(**(await db.settings.find_one({"id": "singleton"}) or {}))

    return DisplayPayload(
        mosque=mosque,
        prayer_times=prayer_times,
        layout=layout,
        slides=slides,
        info_slides=info,
        donation=donation,
        events=events,
        running_texts=running,
        azan=azan,
        iqamah=iqamah,
        murattal=murattal,
        settings=settings,
    )
