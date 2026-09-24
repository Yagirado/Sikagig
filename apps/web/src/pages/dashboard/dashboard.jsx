import { Search, Bell, Menu } from "lucide-react";
import { useNavigate } from "react-router";
import CategoryFilter from "../../components/categoryfilter";
import CardJob from "../../components/cardjob";
import CardJasa from "../../components/cardjasa";
import BottomNavbar from "../../components/bottomnavbar";
import { useEffect, useState } from "react";


export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        async function getUser() {
            const response = await fetch("/api/auth/me", {
                credentials:"include",
                headers: { Accept: "application/json"},
            });
            if (response.ok) {
                const data = await response.json();

                if(!data.user) return;

                setUser(data.user);

                if(window.opener && !window.opener.closed) {
                    window.opener.postMessage(
                        {type: "google-login-success"},
                        window.location.origin
                    );
                }
            }
        }
        getUser();
    }, []);

    return (
        <div className="mobile-container text-white pt-1!">
            <header className="sticky top-0 z-50 -mx-6 bg-[#151515] px-6 pt-5 pb-2">
                <div className="w-full flex justify-between items-center pb-3">
                    <div>
                        <h1 className="text-2xl font-black text-white">Yo, {user?.fullName ?? "User"}</h1>
                        <p className="text-sm text-gray-400">Mau cari apa di GIG?</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => navigate("/notifications")} className="p-2.5 rounded-2xl bg-dark border border-gray-700 text-gray-300 active:bg-gray-800 active:scale-95 transition-all">
                            <Bell size={18} />
                        </button>
                        <button onClick={() => navigate("/profile")} className="p-2.5 rounded-2xl bg-dark border border-gray-700 text-gray-300 active:bg-gray-800 active:scale-95 transition-all">
                            <Menu size={18} />
                        </button>
                    </div>
                </div>
            </header>
            <div className="flex flex-col gap-4 pb-28">

                <div onClick={() => navigate("/homesearch")}
                    className="flex items-center bg-dark border-[1.5px] border-gray-600 px-3 py-3 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform">
                    <Search className="text-gray-400 shrink-0 mr-2" size={18} />
                    <span className="text-sm text-gray-400">
                        Explore gig, jasa
                    </span>
                </div>

                <CategoryFilter />
                
                {/* GIG REKOMENDASI */}
                <CardJob 
                    title="Gig rekomendasi buat kamu" 
                    endpoint="/api/gigs" 
                    variant="primary" 
                />

                {/* GIG TERBARU */}
                <CardJob 
                    title="Gig terbaru" 
                    endpoint="/api/gigs?sort=newest" 
                    variant="light" 
                />

                {/* JASA REKOMENDASI */}
                <CardJasa 
                    title="Jasa rekomendasi buat kamu" 
                    endpoint="/api/jasas" 
                    variant="primary" 
                />

                {/* JASA TERBARU */}
                <CardJasa 
                    title="Jasa terbaru" 
                    endpoint="/api/jasas?sort=newest" 
                    variant="light" 
                />

                <BottomNavbar />
            </div>
        </div>     
    );
}
