"""Layout templates: catalog CRUD, activate, reset, create-custom."""

from fastapi import APIRouter, HTTPException

from lib.db import db
from models.schemas import Layout, LayoutConfig, LayoutCreate, LayoutUpdate

router = APIRouter(prefix="/layouts", tags=["layouts"])

# (key, name, description, config overrides) — list order defines catalog order.
TEMPLATE_META: list[tuple[str, str, str, dict]] = [
    ("signature", "SIGNATURE", "Desain biru Islami klasik dengan aksen emas: jadwal shalat di kiri, jam di tengah, foto masjid di kanan, running text di bawah.", {}),
    ("ultra_wide", "ULTRA WIDE", "Foto masjid dominan penuh layar dengan jadwal shalat horizontal membentang di bagian bawah.", {"prayer_time_position": "bottom", "panel_opacity": 0.75}),
    ("simplicity", "SIMPLICITY", "Minimalis dan bersih: jam besar, jadwal shalat mudah dibaca, tanpa dekorasi berlebihan.", {"panel_opacity": 0.95, "bg_color": "#0F172A", "primary_color": "#1E293B", "accent_color": "#38BDF8"}),
    ("cinematic", "CINEMATIC", "Foto masjid sebagai latar utama dengan panel transparan, overlay ringan, tampilan modern dan elegan.", {"panel_opacity": 0.55}),
    ("horizontal", "HORIZONTAL", "Jadwal shalat tersusun horizontal, jam besar, informasi salat berikutnya lebih menonjol.", {"prayer_time_position": "bottom"}),
    ("vertical", "VERTICAL", "Informasi tersusun vertikal dalam layar landscape: panel kiri jadwal, panel kanan jam dan konten.", {"prayer_time_position": "left"}),
    ("digital_clock", "DIGITAL CLOCK", "Jam digital raksasa dengan nama salat berikutnya dan countdown besar di tengah layar.", {"clock_size": 135}),
    ("prayer_focus", "PRAYER FOCUS", "Fokus pada waktu shalat berikutnya: nama, jam, dan hitung mundur besar; waktu lain tetap terlihat.", {"clock_size": 115}),
]

DEFAULT_CONFIG: dict[str, dict] = {
    key: LayoutConfig(**overrides).model_dump() for key, _n, _d, overrides in TEMPLATE_META
}


def _meta(key: str) -> tuple[str, str]:
    for k, n, d, _o in TEMPLATE_META:
        if k == key:
            return n, d
    return key.upper(), ""


@router.get("", response_model=list[Layout])
async def list_layouts():
    docs = await db.layouts.find().to_list(200)
    order = {k: i for i, (k, _n, _d, _o) in enumerate(TEMPLATE_META)}
    docs.sort(key=lambda d: (order.get(d.get("key"), 99), d.get("name", "")))
    return [Layout(**d) for d in docs]


@router.post("", response_model=Layout)
async def create_layout(input: LayoutCreate):
    if input.base_key not in DEFAULT_CONFIG:
        raise HTTPException(status_code=400, detail="Template dasar tidak dikenal")
    name, desc = _meta(input.base_key)
    layout = Layout(
        key=input.base_key,
        name=input.name or name,
        description=input.description or desc,
        is_custom=True,
        config=LayoutConfig(**DEFAULT_CONFIG[input.base_key]),
    )
    await db.layouts.insert_one(layout.model_dump())
    return layout


@router.put("/{layout_id}", response_model=Layout)
async def update_layout(layout_id: str, input: LayoutUpdate):
    doc = await db.layouts.find_one({"id": layout_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Layout tidak ditemukan")
    update: dict = {}
    if input.name is not None:
        update["name"] = input.name
    if input.description is not None:
        update["description"] = input.description
    if input.config is not None:
        update["config"] = input.config.model_dump()
    await db.layouts.update_one({"id": layout_id}, {"$set": update})
    return Layout(**{**doc, **update})


@router.post("/{layout_id}/activate", response_model=Layout)
async def activate_layout(layout_id: str):
    doc = await db.layouts.find_one({"id": layout_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Layout tidak ditemukan")
    await db.layouts.update_many({}, {"$set": {"is_active": False}})
    await db.layouts.update_one({"id": layout_id}, {"$set": {"is_active": True}})
    return Layout(**{**doc, "is_active": True})


@router.post("/{layout_id}/reset", response_model=Layout)
async def reset_layout(layout_id: str):
    doc = await db.layouts.find_one({"id": layout_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Layout tidak ditemukan")
    key = doc.get("key", "signature")
    if key not in DEFAULT_CONFIG:
        raise HTTPException(status_code=400, detail="Konfigurasi default tidak tersedia")
    await db.layouts.update_one({"id": layout_id}, {"$set": {"config": DEFAULT_CONFIG[key]}})
    doc["config"] = DEFAULT_CONFIG[key]
    return Layout(**doc)


@router.delete("/{layout_id}")
async def delete_layout(layout_id: str):
    doc = await db.layouts.find_one({"id": layout_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Layout tidak ditemukan")
    if not doc.get("is_custom"):
        raise HTTPException(status_code=400, detail="Layout bawaan tidak dapat dihapus")
    if doc.get("is_active"):
        raise HTTPException(status_code=400, detail="Nonaktifkan layout ini sebelum menghapus")
    await db.layouts.delete_one({"id": layout_id})
    return {"ok": True}
