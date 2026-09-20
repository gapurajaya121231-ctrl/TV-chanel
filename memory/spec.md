# Masjid Display — Living Spec

## What it is
Digital signage TV masjid (Bahasa Indonesia): jadwal shalat otomatis, jam digital
detik-per-detik, tanggal Masehi + Hijriah, countdown azan & iqamah, slideshow foto
masjid, info/donasi slides, kegiatan Islam, running text, dan murattal. Admin panel
tanpa login; halaman TV kiosk 16:9 tanpa scroll dengan Wake Lock (layar tetap menyala).

## URL
- `/` — landing (Buka Display TV / Panel Admin)
- `/display` — halaman TV kiosk 16:9 (1920x1080), no-scroll, wake lock, fallback jam saat backend mati
- `/admin` — dashboard (kartu statistik bisa diketuk → dialog isinya; preview TV bisa diklik → buka /display) + 16 menu sidebar: masjid-profile, prayer-time, layouts,
  localization, main-slider, info-slide, donation-slide, islamic-event, running-text,
  azan-screen, iqamah-screen, scheduled-murattal, masjid-web, display-preview, settings
- `/admin/layouts` — katalog template (card 16:9 live preview, tombol Preview /
  Use This Layout, badge ACTIVE, Create New Layout, panel kustomisasi + live preview)

## Data model (Mongo, DB "app")
- `mosque` (singleton): name, address, city, province, country, latitude, longitude,
  timezone, website, phone, logo_url, photo_url
- `prayer_settings` (singleton): method (KEMENAG|MWL|ISNA|EGYPT|MAKKAH|MANUAL),
  asr_method (STANDARD|HANAFI), corrections {prayer: menit}, manual_times {prayer: HH:MM}
- `layouts`: 8 bawaan (signature, ultra_wide, simplicity, cinematic, horizontal,
  vertical, digital_clock, prayer_focus) + kustom; tepat satu `is_active`;
  config: primary/secondary/accent/text/bg colors, panel_opacity, font_size,
  clock_size, logo_position, mosque_name_position, prayer_time_position,
  background_position, running_text_speed, running_text_size (persen skala teks)
- `slider_images`: url, title, is_utama, order
- `info_slides`: slide_type (pengumuman|kajian|info|masjid), title, body, image_url, is_active, order
- `donation` (singleton): title, text, qr_url, bank_name, account_number, account_name, is_active
- `events`: title, date, time, description
- `running_texts`: text, speed (detik/putaran), is_active, order
- `azan_settings` (singleton): enabled, message, duration_minutes, show_countdown
- `iqamah_settings` (singleton): enabled, offsets {subuh..isya: menit}, message
- `murattal`: title, start_time, duration_minutes, enabled
- `settings` (singleton): slideshow_enabled, slideshow_interval, show_imsak, show_hijri, show_running_text

## Key API (semua di bawah /api)
GET /api/display (agregat TV) — /api/mosque GET|PUT — /api/prayer-settings GET|PUT —
/api/prayer-times (hitung server) — /api/layouts GET|POST|PUT|DELETE + /{id}/activate|reset —
/api/slider GET|POST|PATCH|DELETE — /api/info-slides CRUD — /api/donation GET|PUT —
/api/events CRUD — /api/running-texts CRUD — /api/azan-settings GET|PUT —
/api/iqamah-settings GET|PUT — /api/murattal CRUD — /api/settings GET|PUT —
/api/uploads POST (multipart) + GET /{name}

## Key flows
- TV: GET /api/display sekali + refetch 60 dtk → render layout aktif via LayoutEngine.
  Fase: normal → azan (layar penuh, durasi azan.duration_minutes) → iqamah countdown
  (offset per shalat) → normal. Jam memakai timezone masjid (Intl, en-GB jam).
- Jadwal shalat: dihitung server (lib/prayer.py, algoritma praytimes-style) dari
  lat/lng/timezone + metode + koreksi menit; MANUAL memakai manual_times. Imsak = subuh −10 menit.
- Hijri: algoritma tabular Kuwaiti (lib/hijri.py), nama bulan Indonesia.
- Upload: POST /api/uploads multipart → disimpan backend/uploads → dilayani /api/uploads/{name}.

## Layout Engine
`frontend/src/components/display/LayoutEngine.tsx` menerima (data, layout?, config?, now,
phase?) — semua template membaca data yang sama; kustomisasi (draft config) live tanpa reload.

## Seed
`cd /app/backend && python seed.py` (idempoten): Masjid Raya Al-Muhajirin (Jakarta,
Asia/Jakarta), 8 layout (signature aktif), 4 foto slider Unsplash, 3 info slide,
donasi BSI, 3 kegiatan mendatang, 2 running text, 2 jadwal murattal.

## Credentials
Tidak ada autentikasi — panel admin terbuka sesuai permintaan user.
