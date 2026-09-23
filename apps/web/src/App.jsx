import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Login from "./pages/login/login";
import Register from "./pages/register/register";
import Otp from "./pages/otp/otp";
import GoogleOnBoarding from "./pages/google-onboarding/googleOnBoarding";
import Dashboard from "./pages/dashboard/dashboard";
import Notifications from "./pages/notification/notifications";
import BuatGig from "./pages/gig/BuatGig";
import Activity from "./pages/activity/activity";
import Chats from "./pages/chat/chats";
import PostGigForm from "./pages/gig/post/PostGig";
import TawarkanJasaForm from "./pages/gig/jasa/TawarinJasa";
import Profile from "./pages/profile/profile";
import EditProfile from "./pages/profile/editprofile";
import About from "./pages/profile/about";
import ProtedtedRoute from "./components/protectedroute";
import Explore from "./pages/explore/explore";
import HomeSearch from "./components/homesearch";
import HistoryTransaksi from "./pages/profile/riwayattransaksi";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<ProtedtedRoute key="guest" guestOnly />}>
          <Route path="/login" element={<Login />} />
        </Route>
        <Route path="/register" element={<Register />} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/google" element={<GoogleOnBoarding />} />

        <Route element={<ProtedtedRoute key="authenticated" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile-edit" element={<EditProfile />} />
          <Route path="/wallet-transaksi" element={<HistoryTransaksi />} />
          <Route path="/about" element={<About />} />
          <Route path="/buatgig" element={<BuatGig />} />
          <Route path="/buatgig/post" element={<PostGigForm />} />
          <Route path="/buatgig/jasa" element={<TawarkanJasaForm />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/homesearch" element={<HomeSearch />} />
        </Route>        
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
