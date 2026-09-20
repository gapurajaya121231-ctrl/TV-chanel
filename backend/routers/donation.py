"""Donation slide (infak/sedekah): single doc with QR + rekening."""

from fastapi import APIRouter

from lib.db import db
from models.schemas import DonationSlide

router = APIRouter(prefix="/donation", tags=["donation"])


async def _get_or_create() -> dict:
    doc = await db.donation.find_one({"id": "singleton"})
    if not doc:
        doc = DonationSlide().model_dump()
        await db.donation.insert_one(doc)
    return doc


@router.get("", response_model=DonationSlide)
async def get_donation():
    return await _get_or_create()


@router.put("", response_model=DonationSlide)
async def update_donation(input: DonationSlide):
    input.id = "singleton"
    await db.donation.update_one(
        {"id": "singleton"}, {"$set": input.model_dump()}, upsert=True
    )
    return input
