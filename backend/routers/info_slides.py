"""Info slides: announcements, kajian schedule, mosque info."""

from fastapi import APIRouter, HTTPException

from lib.db import db
from models.schemas import InfoSlide, InfoSlideCreate

router = APIRouter(prefix="/info-slides", tags=["info-slides"])


@router.get("", response_model=list[InfoSlide])
async def list_slides():
    docs = await db.info_slides.find().sort("order", 1).to_list(200)
    return [InfoSlide(**d) for d in docs]


@router.post("", response_model=InfoSlide)
async def create_slide(input: InfoSlideCreate):
    count = await db.info_slides.count_documents({})
    slide = InfoSlide(**input.model_dump(), order=count)
    await db.info_slides.insert_one(slide.model_dump())
    return slide


@router.put("/{slide_id}", response_model=InfoSlide)
async def update_slide(slide_id: str, input: InfoSlideCreate):
    doc = await db.info_slides.find_one({"id": slide_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Slide tidak ditemukan")
    merged = {**doc, **input.model_dump()}
    await db.info_slides.update_one({"id": slide_id}, {"$set": merged})
    return InfoSlide(**merged)


@router.delete("/{slide_id}")
async def delete_slide(slide_id: str):
    res = await db.info_slides.delete_one({"id": slide_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Slide tidak ditemukan")
    return {"ok": True}
