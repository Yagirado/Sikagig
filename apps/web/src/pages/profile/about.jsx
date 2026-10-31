import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export default function About(){
    const navigate = useNavigate();
    
    return (
        <div className="mobile-container text-white pt-1!">

            <header className="sticky top-0 z-50 -mx-6 bg-[#151515] px-6 py-2.5">
                <div className="relative flex items-center justify-center py-2">
                    <h1 className="text-lg font-black text-white text-center">
                        Tentang Aplikasi
                    </h1>
                    <button onClick={() => navigate("/profile")} className="absolute left-0 p-2.5 rounded-2xl bg-neutral-900 border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                </div>
            </header>
            <div>
                
            </div>
        </div>
    );
}