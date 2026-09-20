// Hand-written mirrors of the Pydantic models in backend/models/schemas.py.
// Nothing infers across the HTTP boundary — keep both in sync in the same edit.

export interface MosqueProfile {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  website: string;
  phone: string;
  logo_url: string;
  photo_url: string;
}

export interface PrayerSettings {
  id: string;
  method: string; // KEMENAG | MWL | ISNA | EGYPT | MAKKAH | MANUAL
  asr_method: string; // STANDARD | HANAFI
  corrections: Record<string, number>;
  manual_times: Record<string, string>;
}

export interface HijriInfo {
  day: number;
  month: number;
  year: number;
  month_name: string;
  formatted: string;
}

export interface PrayerTimesOut {
  date: string;
  source: string; // auto | manual
  times: Record<string, string>;
  hijri: HijriInfo;
  gregorian_formatted: string;
}

export interface LayoutConfig {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  bg_color: string;
  panel_opacity: number;
  font_size: number;
  clock_size: number;
  logo_position: string; // left | center | right | hidden
  mosque_name_position: string; // left | center | right
  prayer_time_position: string; // left | right | bottom
  background_position: string;
  running_text_speed: number; // seconds per loop
  running_text_size: number; // percent scale of the running text bar
}

export interface Layout {
  id: string;
  key: string;
  name: string;
  description: string;
  is_active: boolean;
  is_custom: boolean;
  config: LayoutConfig;
}

export interface SliderImage {
  id: string;
  url: string;
  title: string;
  is_utama: boolean;
  order: number;
  created_at: string;
}

export interface SliderCreate {
  url: string;
  title?: string;
}

export interface SliderPatch {
  title?: string;
  is_utama?: boolean;
  order?: number;
}

export interface InfoSlide {
  id: string;
  slide_type: string; // pengumuman | kajian | info | masjid
  title: string;
  body: string;
  image_url: string;
  is_active: boolean;
  order: number;
}

export interface InfoSlideCreate {
  slide_type: string;
  title: string;
  body?: string;
  image_url?: string;
  is_active?: boolean;
}

export interface DonationSlide {
  id: string;
  title: string;
  text: string;
  qr_url: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_active: boolean;
}

export interface IslamicEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  description: string;
}

export interface IslamicEventCreate {
  title: string;
  date: string;
  time?: string;
  description?: string;
}

export interface RunningText {
  id: string;
  text: string;
  speed: number; // seconds per loop
  is_active: boolean;
  order: number;
}

export interface RunningTextCreate {
  text: string;
  speed?: number;
  is_active?: boolean;
}

export interface AzanSettings {
  id: string;
  enabled: boolean;
  message: string;
  duration_minutes: number;
  show_countdown: boolean;
}

export interface IqamahSettings {
  id: string;
  enabled: boolean;
  offsets: Record<string, number>; // per-prayer minutes after azan
  message: string;
}

export interface MurattalSchedule {
  id: string;
  title: string;
  start_time: string; // HH:MM
  duration_minutes: number;
  enabled: boolean;
}

export interface MurattalCreate {
  title?: string;
  start_time: string;
  duration_minutes?: number;
}

export interface GeneralSettings {
  id: string;
  slideshow_enabled: boolean;
  slideshow_interval: number;
  show_imsak: boolean;
  show_hijri: boolean;
  show_running_text: boolean;
}

export interface DisplayData {
  mosque: MosqueProfile;
  prayer_times: PrayerTimesOut;
  layout: Layout;
  slides: SliderImage[];
  info_slides: InfoSlide[];
  donation: DonationSlide | null;
  events: IslamicEvent[];
  running_texts: RunningText[];
  azan: AzanSettings;
  iqamah: IqamahSettings;
  murattal: MurattalSchedule[];
  settings: GeneralSettings;
}
