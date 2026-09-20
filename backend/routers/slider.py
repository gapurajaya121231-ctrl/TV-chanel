"""Main slider: mosque photo CRUD + set-utama."""

from fastapi import APIRouter, HTTPException

from lib.db import db
from lib.dates import today_iso
from models.schemas import SliderCreate, SliderImage, SliderPatch

router = APIRouter(prefix="/slider", tags=["slider"])


@router.get("", response_model=list[SliderImage])
async def list_images():
    docs = await db.slider_images.find().sort([("is_utama", -1), ("order", 1)]).to_list(200)
    return [SliderImage(**d) for d in docs]


@router.post("", response_model=SliderImage)
async def add_image(input: SliderCreate):
    count = await db.slider_images.count_documents({})
    img = SliderImage(
        url=input.url,
        title=input.title,
        order=count,
        created_at=today_iso(),
        is_utama=count == 0,  # first photo becomes the utama automatically
    )
    await db.slider_images.insert_one(img.model_dump())
    return img


@router.patch("/{image_id}", response_model=SliderImage)
async def patch_image(image_id: str, input: SliderPatch):
    doc = await db.slider_images.find_one({"id": image_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Foto tidak ditemukan")
    update: dict = {}
    if input.title is not None:
        update["title"] = input.title
    if input.order is not None:
        update["order"] = input.order
    if input.is_utama is not None:
        update["is_utama"] = input.is_utama
        if input.is_utama:
            await db.slider_images.update_many(
                {"id": {"$ne": image_id}}, {"$set": {"is_utama": False}}
            )
    await db.slider_images.update_one({"id": image_id}, {"$set": update})
    return SliderImage(**{**doc, **update})


@router.delete("/{image_id}")
async def delete_image(image_id: str):
    res = await db.slider_images.delete_one({"id": image_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Foto tidak ditemukan")
    return {"ok": True}
