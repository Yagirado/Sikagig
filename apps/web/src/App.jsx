import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Login from "./pages/login/login";
import Register from "./pages/register/register";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>

    // comment sintaks di atas dan uncomment komen sintaks di bawah untuk develop personal
    // <Test />
  );
}
