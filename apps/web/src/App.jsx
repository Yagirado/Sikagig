import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Login from "./pages/login/login";
import Register from "./pages/register/register";
import Otp from "./pages/otp/otp";
import GoogleOnBoarding from "./pages/google-onboarding/googleOnBoarding";
import Dashboard from "./pages/dashboard/dashboard";
import Notifications from "./pages/notification/notifications";
import BuatGig from "./pages/gig/BuatGig";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/** server side render pages might delete later */}
        <Route path="/otp" element={<Otp />} />
        <Route path="/google" element={<GoogleOnBoarding />} />

        {/** Route Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/notifications" element={<Notifications />} />

        {/** Route BUat Gig */}
        <Route path="/buatgig" element={<BuatGig />} />
      </Routes>
    </BrowserRouter>


  );
}
