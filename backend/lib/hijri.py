"""Hijri date conversion (Kuwaiti/tabular algorithm) + Indonesian Gregorian formatting."""

from datetime import date

HIJRI_MONTHS_ID = [
    "Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir", "Jumadil Awal", "Jumadil Akhir",
    "Rajab", "Sya'ban", "Ramadhan", "Syawal", "Dzulqa'dah", "Dzulhijjah",
]

_DAYS_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
_MONTHS_ID = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]


def _gregorian_to_jd(y: int, m: int, d: int) -> int:
    if m < 3:
        y -= 1
        m += 12
    a = y // 100
    b = 2 - a + a // 4
    return int(365.25 * (y + 4716)) + int(30.6001 * (m + 1)) + d + b - 1524


def hijri_from_date(d: date) -> dict:
    """Return {day, month, year, month_name, formatted} for a Gregorian date."""
    jd = _gregorian_to_jd(d.year, d.month, d.day)
    l = jd - 1948440 + 10632
    n = (l - 1) // 10631
    l = l - 10631 * n + 354
    j = (10985 - l) // 5316 * (50 * l) // 17719 + (l // 5670) * (43 * l) // 15238
    l = l - (30 - j) // 15 * (17719 * j) // 50 - (j // 16) * (15238 * j) // 43 + 29
    month = (24 * l) // 709
    day = l - (709 * month) // 24
    year = 30 * n + j - 30
    month = max(1, min(12, month))
    return {
        "day": day,
        "month": month,
        "year": year,
        "month_name": HIJRI_MONTHS_ID[month - 1],
        "formatted": f"{day} {HIJRI_MONTHS_ID[month - 1]} {year} H",
    }


def format_gregorian_id(d: date) -> str:
    """'Kamis, 12 Juni 2025' — Indonesian long date without depending on system locale."""
    weekday = _DAYS_ID[d.weekday()]
    return f"{weekday}, {d.day} {_MONTHS_ID[d.month - 1]} {d.year}"
