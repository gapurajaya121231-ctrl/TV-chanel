import { Navigate, Route, Routes } from "react-router-dom";
import Home from "@/pages/Home";
import Display from "@/pages/Display";
import AdminShell from "@/pages/admin/AdminShell";
import Dashboard from "@/pages/admin/Dashboard";
import ProfilePage from "@/pages/admin/ProfilePage";
import PrayerTimePage from "@/pages/admin/PrayerTimePage";
import LayoutsPage from "@/pages/admin/LayoutsPage";
import LocalizationPage from "@/pages/admin/LocalizationPage";
import SliderPage from "@/pages/admin/SliderPage";
import InfoSlidePage from "@/pages/admin/InfoSlidePage";
import DonationPage from "@/pages/admin/DonationPage";
import EventsPage from "@/pages/admin/EventsPage";
import RunningTextPage from "@/pages/admin/RunningTextPage";
import AzanPage from "@/pages/admin/AzanPage";
import IqamahPage from "@/pages/admin/IqamahPage";
import MurattalPage from "@/pages/admin/MurattalPage";
import MasjidWebPage from "@/pages/admin/MasjidWebPage";
import DisplayPreviewPage from "@/pages/admin/DisplayPreviewPage";
import SettingsPage from "@/pages/admin/SettingsPage";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/display" element={<Display />} />
      <Route path="/admin" element={<AdminShell />}>
        <Route index element={<Dashboard />} />
        <Route path="masjid-profile" element={<ProfilePage />} />
        <Route path="prayer-time" element={<PrayerTimePage />} />
        <Route path="layouts" element={<LayoutsPage />} />
        <Route path="localization" element={<LocalizationPage />} />
        <Route path="main-slider" element={<SliderPage />} />
        <Route path="info-slide" element={<InfoSlidePage />} />
        <Route path="donation-slide" element={<DonationPage />} />
        <Route path="islamic-event" element={<EventsPage />} />
        <Route path="running-text" element={<RunningTextPage />} />
        <Route path="azan-screen" element={<AzanPage />} />
        <Route path="iqamah-screen" element={<IqamahPage />} />
        <Route path="scheduled-murattal" element={<MurattalPage />} />
        <Route path="masjid-web" element={<MasjidWebPage />} />
        <Route path="display-preview" element={<DisplayPreviewPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
