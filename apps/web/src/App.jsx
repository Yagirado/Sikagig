import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Login from "./pages/login/login";
import Register from "./pages/register/register";
import Otp from "./pages/otp/otp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/** server side render pages might delete later */}
        <Route path="/otp" element={<Otp />} />
      </Routes>
    </BrowserRouter>

    // comment sintaks di atas dan uncomment komen sintaks di bawah untuk develop personal
    // <Test />
  );
}
