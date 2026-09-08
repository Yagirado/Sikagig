import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export default function Notifications() {
    const navigate = useNavigate();

return (
    <div className="mobile-container text-white p-4">

        <div className="flex flex-col gap-4">
            <div className="relative flex items-center justify-center py-2">
                <h1 className="text-2xl font-black text-white text-center">
                    Notifikasi
                </h1>
                <button onClick={() => navigate("/dashboard")} className="absolute left-0 p-2.5 rounded-2xl bg-dark border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors">
                    <ArrowLeft size={18} />
                </button>
            </div>

            <div className="text-base text-white text-center">
                <p>Belom ada notifikasi</p>
            </div>
        </div>
    </div>
);
}