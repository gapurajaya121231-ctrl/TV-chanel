"""Idempotent seed: singletons, 8 layout templates, sample content.

Run: cd /app/backend && python seed.py
"""

import uuid
from datetime import date, timedelta

from lib.db import client, db, ensure_indexes
from lib.dates import today_iso
from models.schemas import (
    AzanSettings,
    DonationSlide,
    GeneralSettings,
    IqamahSettings,
    Layout,
    LayoutConfig,
    MosqueProfile,
    PrayerSettings,
)
from routers.layouts import TEMPLATE_META

SLIDER_SAMPLES = [
    ("Masjid Raya Al-Muhajirin", "https://images.unsplash.com/photo-1537181534458-45dcee76ae90?crop=entropy&cs=srgb&fm=jpg&q=85"),
    ("Suasana Maghrib", "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?crop=entropy&cs=srgb&fm=jpg&q=85"),
    ("Ornamen Kubah", "https://images.unsplash.com/photo-1558114965-eeb97aa84c3b?crop=entropy&cs=srgb&fm=jpg&q=85"),
    ("Kaligrafi Kubah Emas", "https://images.unsplash.com/photo-1542414110-ae27fdb87ee1?crop=entropy&cs=srgb&fm=jpg&q=85"),
]

INFO_SAMPLES = [
    ("pengumuman", "Pengumuman Jamaah", "Shalat Jumat dimulai pukul 11:45. Jamaah dipersilakan datang lebih awal dan parkir dengan tertib."),
    ("kajian", "Jadwal Kajian", "Kajian Tafsir Al-Qur'an setiap Ahad ba'da Subuh bersama Ust. Ahmad Fauzi, Lc. di aula utama."),
    ("masjid", "Profil Masjid", "Masjid Raya Al-Muhajirin menyediakan tempat wudhu luas, ruang pendingin, dan area parkir gratis untuk jamaah."),
]

RUNNING_SAMPLES = [
    ("Selamat datang di Masjid Raya Al-Muhajirin — marilah kita memperbanyak shalawat dan dzikir.", 40),
    ("Donasi pembangunan menara dapat disetorkan melalui rekening resmi DKM. Jazakumullahu khairan.", 60),
]


async def seed() -> None:
    await ensure_indexes()

    singletons = {
        "mosque": MosqueProfile(),
        "prayer_settings": PrayerSettings(),
        "azan_settings": AzanSettings(),
        "iqamah_settings": IqamahSettings(),
        "settings": GeneralSettings(),
        "donation": DonationSlide(),
    }
    for collection, model in singletons.items():
        doc = model.model_dump()
        await db[collection].update_one({"id": doc["id"]}, {"$setOnInsert": doc}, upsert=True)

    if await db.layouts.count_documents({}) == 0:
        first = True
        for key, name, desc, overrides in TEMPLATE_META:
            layout = Layout(
                key=key, name=name, description=desc,
                is_active=first, config=LayoutConfig(**overrides),
            )
            await db.layouts.insert_one(layout.model_dump())
            first = False

    if await db.slider_images.count_documents({}) == 0:
        for i, (title, url) in enumerate(SLIDER_SAMPLES):
            await db.slider_images.insert_one({
                "id": str(uuid.uuid4()), "url": url, "title": title,
                "is_utama": i == 0, "order": i, "created_at": today_iso(),
            })

    if await db.info_slides.count_documents({}) == 0:
        for i, (slide_type, title, body) in enumerate(INFO_SAMPLES):
            await db.info_slides.insert_one({
                "id": str(uuid.uuid4()), "slide_type": slide_type, "title": title,
                "body": body, "image_url": "", "is_active": True, "order": i,
            })

    if await db.running_texts.count_documents({}) == 0:
        for i, (text, speed) in enumerate(RUNNING_SAMPLES):
            await db.running_texts.insert_one({
                "id": str(uuid.uuid4()), "text": text, "speed": speed,
                "is_active": True, "order": i,
            })

    if await db.events.count_documents({}) == 0:
        today = date.today()
        samples = [
            ("Kajian Tafsir Al-Qur'an", (today + timedelta(days=2)).isoformat(), "18:30",
             "Bersama Ust. Ahmad Fauzi, Lc. di aula utama masjid. Terbuka untuk umum."),
            ("Gotong Royong & Rapat DKM", (today + timedelta(days=7)).isoformat(), "08:00",
             "Pembersihan area masjid dilanjutkan rapat bulanan DKM."),
            ("Santunan Anak Yatim", (today + timedelta(days=14)).isoformat(), "09:00",
             "Penyerahan santunan kepada 50 anak yatim binaan masjid."),
        ]
        for title, event_date, event_time, desc in samples:
            await db.events.insert_one({
                "id": str(uuid.uuid4()), "title": title, "date": event_date,
                "time": event_time, "description": desc,
            })

    if await db.murattal.count_documents({}) == 0:
        for title, start_time, duration in [("Murattal Pagi", "05:00", 30), ("Murattal Sore", "16:00", 30)]:
            await db.murattal.insert_one({
                "id": str(uuid.uuid4()), "title": title, "start_time": start_time,
                "duration_minutes": duration, "enabled": True,
            })

    print("Seed selesai: masjid, jadwal shalat, 8 layout, slider, info slide, running text, event, murattal.")
    client.close()


if __name__ == "__main__":
    import asyncio

    asyncio.run(seed())
