"""Pydantic v2 models — every endpoint body/response.

Mirror 1:1 by hand in frontend/src/lib/types.ts: when a model changes here, change its
TS interface there in the same edit (nothing infers across the HTTP boundary).
"""

import uuid

from pydantic import BaseModel, Field


def _uuid() -> str:
    return str(uuid.uuid4())


# --- Mosque ---

class MosqueProfile(BaseModel):
    id: str = Field(default="singleton")
    name: str = "Masjid Raya Al-Muhajirin"
    address: str = "Jl. Merdeka Selatan No. 1, Jakarta Pusat"
    city: str = "Jakarta"
    province: str = "DKI Jakarta"
    country: str = "Indonesia"
    latitude: float = -6.1754
    longitude: float = 106.8272
    timezone: str = "Asia/Jakarta"
    website: str = ""
    phone: str = ""
    logo_url: str = ""
    photo_url: str = ""


# --- Prayer ---

class PrayerSettings(BaseModel):
    id: str = Field(default="singleton")
    method: str = "KEMENAG"  # KEMENAG | MWL | ISNA | EGYPT | MAKKAH | MANUAL
    asr_method: str = "STANDARD"  # STANDARD | HANAFI
    corrections: dict[str, int] = Field(default_factory=dict)
    manual_times: dict[str, str] = Field(default_factory=dict)


class HijriInfo(BaseModel):
    day: int
    month: int
    year: int
    month_name: str
    formatted: str


class PrayerTimesOut(BaseModel):
    date: str
    source: str  # auto | manual
    times: dict[str, str]
    hijri: HijriInfo
    gregorian_formatted: str


# --- Layouts ---

class LayoutConfig(BaseModel):
    primary_color: str = "#0B1D3A"
    secondary_color: str = "#061325"
    accent_color: str = "#F59E0B"
    text_color: str = "#FFFFFF"
    bg_color: str = "#061325"
    panel_opacity: float = 0.9
    font_size: int = 100
    clock_size: int = 100
    logo_position: str = "left"  # left | center | right | hidden
    mosque_name_position: str = "center"  # left | center | right
    prayer_time_position: str = "left"  # left | right | bottom
    background_position: str = "center"  # CSS object-position
    running_text_speed: int = 40  # seconds per loop
    running_text_size: int = 100  # percent scale of the running text bar


class Layout(BaseModel):
    id: str = Field(default_factory=_uuid)
    key: str = "signature"
    name: str = "SIGNATURE"
    description: str = ""
    is_active: bool = False
    is_custom: bool = False
    config: LayoutConfig = Field(default_factory=LayoutConfig)


class LayoutCreate(BaseModel):
    name: str
    base_key: str = "signature"
    description: str = ""


class LayoutUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    config: LayoutConfig | None = None


# --- Slider ---

class SliderImage(BaseModel):
    id: str = Field(default_factory=_uuid)
    url: str
    title: str = ""
    is_utama: bool = False
    order: int = 0
    created_at: str = ""


class SliderCreate(BaseModel):
    url: str
    title: str = ""


class SliderPatch(BaseModel):
    title: str | None = None
    is_utama: bool | None = None
    order: int | None = None


# --- Info slides ---

class InfoSlide(BaseModel):
    id: str = Field(default_factory=_uuid)
    slide_type: str = "info"  # pengumuman | kajian | info | masjid
    title: str
    body: str = ""
    image_url: str = ""
    is_active: bool = True
    order: int = 0


class InfoSlideCreate(BaseModel):
    slide_type: str = "info"
    title: str
    body: str = ""
    image_url: str = ""
    is_active: bool = True


# --- Donation ---

class DonationSlide(BaseModel):
    id: str = Field(default="singleton")
    title: str = "Infak & Sedekah"
    text: str = "Setorkan infak terbaik Anda melalui rekening resmi masjid. Jazakumullahu khairan."
    qr_url: str = ""
    bank_name: str = "Bank Syariah Indonesia"
    account_number: str = ""
    account_name: str = ""
    is_active: bool = True


# --- Islamic events ---

class IslamicEvent(BaseModel):
    id: str = Field(default_factory=_uuid)
    title: str
    date: str  # YYYY-MM-DD
    time: str = ""  # HH:MM
    description: str = ""


class IslamicEventCreate(BaseModel):
    title: str
    date: str
    time: str = ""
    description: str = ""


# --- Running text ---

class RunningText(BaseModel):
    id: str = Field(default_factory=_uuid)
    text: str
    speed: int = 40
    size: int = 100  # percent scale of this text on screen (60–200)
    is_active: bool = True
    order: int = 0


class RunningTextCreate(BaseModel):
    text: str
    speed: int = 40
    size: int = 100
    is_active: bool = True


# --- Azan / Iqamah / Murattal / General settings ---

class AzanSettings(BaseModel):
    id: str = Field(default="singleton")
    enabled: bool = True
    message: str = "Dengarlah azan dan datanglah ke masjid. Imam akan segera mengambil tempat."
    duration_minutes: int = 3
    show_countdown: bool = True


class IqamahSettings(BaseModel):
    id: str = Field(default="singleton")
    enabled: bool = True
    offsets: dict[str, int] = Field(
        default_factory=lambda: {"subuh": 10, "dzuhur": 10, "ashar": 10, "maghrib": 10, "isya": 10}
    )
    message: str = "Marilah menuju shalat"


class MurattalSchedule(BaseModel):
    id: str = Field(default_factory=_uuid)
    title: str = "Murattal"
    start_time: str = "05:30"
    duration_minutes: int = 30
    enabled: bool = True


class MurattalCreate(BaseModel):
    title: str = "Murattal"
    start_time: str
    duration_minutes: int = 30


class GeneralSettings(BaseModel):
    id: str = Field(default="singleton")
    slideshow_enabled: bool = True
    slideshow_interval: int = 20
    show_imsak: bool = True
    show_hijri: bool = True
    show_running_text: bool = True


# --- Display aggregate (single GET for the TV page) ---

class DisplayPayload(BaseModel):
    mosque: MosqueProfile
    prayer_times: PrayerTimesOut
    layout: Layout
    slides: list[SliderImage] = []
    info_slides: list[InfoSlide] = []
    donation: DonationSlide | None = None
    events: list[IslamicEvent] = []
    running_texts: list[RunningText] = []
    azan: AzanSettings
    iqamah: IqamahSettings
    murattal: list[MurattalSchedule] = []
    settings: GeneralSettings
