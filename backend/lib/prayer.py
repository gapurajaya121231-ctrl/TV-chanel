"""Compact prayer-time calculation (praytimes-style algorithm).

Computes Imsak/Subuh/Syuruq/Dzuhur/Ashar/Maghrib/Isya from coordinates + timezone,
with per-prayer minute corrections and a manual-override mode.
"""

import math
from datetime import date, datetime
from zoneinfo import ZoneInfo

PRAYER_KEYS = ["imsak", "subuh", "syuruq", "dzuhur", "ashar", "maghrib", "isya"]
AZAN_KEYS = ["subuh", "dzuhur", "ashar", "maghrib", "isya"]

# fajr/isha sun depression angles (degrees); MAKKAH uses 90 min after maghrib for isya
METHODS: dict[str, dict] = {
    "KEMENAG": {"fajr": 20.0, "isha": 18.0, "dhuhr_pad": 2},
    "MWL": {"fajr": 18.0, "isha": 17.0, "dhuhr_pad": 1},
    "ISNA": {"fajr": 15.0, "isha": 15.0, "dhuhr_pad": 0},
    "EGYPT": {"fajr": 19.5, "isha": 17.5, "dhuhr_pad": 2},
    "MAKKAH": {"fajr": 18.5, "isha": None, "isha_minutes": 90, "dhuhr_pad": 2},
}

DEG = math.pi / 180.0


def _sin(a: float) -> float:
    return math.sin(a * DEG)


def _cos(a: float) -> float:
    return math.cos(a * DEG)


def _tan(a: float) -> float:
    return math.tan(a * DEG)


def _asin(x: float) -> float:
    return math.asin(x) / DEG


def _acos(x: float) -> float:
    return math.acos(x) / DEG


def _atan2(y: float, x: float) -> float:
    return math.atan2(y, x) / DEG


def _acot(x: float) -> float:
    return math.atan(1.0 / x) / DEG


def _fix_angle(a: float) -> float:
    return a - 360.0 * math.floor(a / 360.0)


def _fix_hour(h: float) -> float:
    return h - 24.0 * math.floor(h / 24.0)


def _julian_day(d: date) -> float:
    y, m = d.year, d.month
    if m <= 2:
        y -= 1
        m += 12
    a = math.floor(y / 100)
    b = 2 - a + math.floor(a / 4)
    return math.floor(365.25 * (y + 4716)) + math.floor(30.6001 * (m + 1)) + d.day + b - 1524.5


def _sun_position(jd: float) -> tuple[float, float]:
    """Return (declination, equation-of-time-in-hours)."""
    d = jd - 2451545.0
    g = _fix_angle(357.529 + 0.98560028 * d)
    q = _fix_angle(280.459 + 0.98564736 * d)
    l = _fix_angle(q + 1.915 * _sin(g) + 0.020 * _sin(2 * g))
    e = 23.439 - 0.00000036 * d
    ra = _fix_hour(_atan2(_cos(e) * _sin(l), _cos(l)) / 15.0)
    decl = _asin(_sin(e) * _sin(l))
    eqt = _fix_hour(q / 15.0 - ra + 12.0) - 12.0
    return decl, eqt


def _tz_offset_hours(tz_name: str, d: date) -> float:
    try:
        zone = ZoneInfo(tz_name)
    except Exception:
        zone = ZoneInfo("UTC")
    noon = datetime(d.year, d.month, d.day, 12, 0, tzinfo=zone)
    off = noon.utcoffset()
    return (off.total_seconds() / 3600.0) if off else 0.0


def _angle_time(angle: float, decl: float, lat: float) -> float | None:
    """Hours from solar noon to the moment the sun is at `angle` degrees below horizon."""
    num = -_sin(angle) - _sin(lat) * _sin(decl)
    den = _cos(lat) * _cos(decl)
    if den == 0:
        return None
    x = num / den
    if x < -1 or x > 1:
        return None
    return _acos(x) / 15.0


def _fmt(hours: float | None, correction_min: int = 0) -> str | None:
    if hours is None:
        return None
    h = _fix_hour(hours + correction_min / 60.0)
    hh = int(math.floor(h))
    mm = int(round((h - hh) * 60.0))
    if mm == 60:
        hh, mm = hh + 1, 0
    hh %= 24
    return f"{hh:02d}:{mm:02d}"


def compute_times(
    d: date,
    lat: float,
    lng: float,
    tz_name: str,
    method: str = "KEMENAG",
    asr_method: str = "STANDARD",
    corrections: dict[str, int] | None = None,
    manual_times: dict[str, str] | None = None,
) -> dict[str, str]:
    """Prayer times for date `d` as {"imsak": "HH:MM", ...}. Falls back to KEMENAG
    when the method is unknown; MANUAL mode uses manual_times when complete."""
    corrections = corrections or {}
    if method == "MANUAL":
        manual = manual_times or {}
        picked = {k: manual.get(k) for k in PRAYER_KEYS}
        if all(isinstance(v, str) and len(v) >= 4 for v in picked.values()):
            return {k: str(v)[:5] for k, v in picked.items()}

    params = METHODS.get(method, METHODS["KEMENAG"])
    jd = _julian_day(d)
    decl, eqt = _sun_position(jd)
    tz = _tz_offset_hours(tz_name, d)
    dhuhr = 12.0 + tz - lng / 15.0 - eqt + params["dhuhr_pad"] / 60.0

    sunrise_t = _angle_time(0.833, decl, lat)
    fajr_t = _angle_time(params["fajr"], decl, lat)
    asr_shadow = 2.0 if asr_method == "HANAFI" else 1.0
    asr_angle = -_acot(asr_shadow + _tan(abs(lat - decl)))
    asr_t = _angle_time(asr_angle, decl, lat)

    if params.get("isha") is None:
        isya_h = (dhuhr + (sunrise_t or 0.0) + params["isha_minutes"] / 60.0) if sunrise_t is not None else None
        isha_correction = 0
    else:
        isha_t = _angle_time(params["isha"], decl, lat)
        isya_h = dhuhr + isha_t if isha_t is not None else None
        isha_correction = corrections.get("isya", 0)

    imsak_h = dhuhr - fajr_t - 10.0 / 60.0 if fajr_t is not None else None
    raw = {
        "imsak": (imsak_h, corrections.get("imsak", 0)),
        "subuh": (dhuhr - fajr_t if fajr_t is not None else None, corrections.get("subuh", 0)),
        "syuruq": (dhuhr - sunrise_t if sunrise_t is not None else None, corrections.get("syuruq", 0)),
        "dzuhur": (dhuhr, corrections.get("dzuhur", 0)),
        "ashar": (dhuhr + asr_t if asr_t is not None else None, corrections.get("ashar", 0)),
        "maghrib": (dhuhr + sunrise_t if sunrise_t is not None else None, corrections.get("maghrib", 0)),
        "isya": (isya_h, isha_correction),
    }
    out: dict[str, str] = {}
    for key, (val, corr) in raw.items():
        formatted = _fmt(val, corr)
        out[key] = formatted if formatted else "00:00"
    return out
