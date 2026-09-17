import { useNavigate } from "react-router";
import BottomNavbar from "../../components/bottomnavbar";
import { useEffect, useState } from "react";
import { BanknoteArrowUp, Bell, ChevronRight, HandCoins, Info, LogOut, Settings } from "lucide-react";

export default function Profile() {
    const [user, setUser] = useState(null);
    const initial = (user?.fullName?.trim()?.[0] ?? "U").toUpperCase();
    const navigate = useNavigate();

    const profileColors = [
        "bg-red-500",
        "bg-orange-500",
        "bg-amber-500",
        "bg-green-500",
        "bg-blue-500",
        "bg-indigo-500",
        "bg-purple-500",
        "bg-pink-500",
    ];
    const colorIndex = (user?.fullName?.length ?? 0) % profileColors.length;
    const profileColor = profileColors[colorIndex];

    useEffect(() => {
        async function getUser() {
            const response = await fetch("/api/auth/me", {
                credentials:"include",
                headers: { Accept: "application/json"},
            });
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            }
        }
        getUser();
    }, []);

    return (
        <div className="mobile-container text-white pt-1!">
            <div className="flex flex-col items-center pt-8">
                <div className={`flex h-20 w-20 items-center justify-center rounded-full ${profileColor} text-3xl font-extrabold text-white`}>
                    {initial}
                </div>
                <h1 className="mt-3 text-center text-xl font-bold">
                    {user?.fullName ?? "User"}
                </h1>
            </div>
            <div className="mt-8 flex flex-col gap-3 pb-20">
                <button type="button" className="rounded-2xl border border-gray-700 bg-dark p-4 text-left">
                    <p className="text-xs text-gray-400">
                        SALDO AKTIF
                    </p>
                    <h1 className="font-bold text-unguterang text-xl">
                        Rp 0
                    </h1>
                </button>

                <h1 className="mt-6 text-xl font-bold">
                    Settings
                </h1>
                <button onClick={() => navigate("/profile-edit")} className="flex items-center justify-between rounded-2xl border border-gray-700 bg-dark px-2 py-2 text-left hover:bg-gray-800 transition-colors">
                    <div className="flex items-center">
                        <Settings className="shrink-0 mx-2" />
                        <h2 className="text-sm text-ungu font-bold">
                            Edit Profile
                        </h2>
                    </div>
                    <ChevronRight className="mx-2"/>
                </button>
                <button onClick={() => navigate("")} className="flex items-center justify-between rounded-2xl border border-gray-700 bg-dark px-2 py-2 text-left hover:bg-gray-800 transition-colors">
                    <div className="flex items-center">
                        <BanknoteArrowUp className="shrink-0 mx-2" />
                        <h2 className="text-sm text-ungu font-bold">
                            Tarik Dana
                        </h2>
                    </div>
                    <ChevronRight className="mx-2"/>
                </button>
                <button onClick={() => navigate("")} className="flex items-center justify-between rounded-2xl border border-gray-700 bg-dark px-2 py-2 text-left hover:bg-gray-800 transition-colors">
                    <div className="flex items-center">
                        <HandCoins className="shrink-0 mx-2" />
                        <h2 className="text-sm text-ungu font-bold">
                            Riwayat Transaksi
                        </h2>
                    </div>
                    <ChevronRight className="mx-2"/>
                </button>
                <button onClick={() => navigate("/notifications")} className="flex items-center justify-between rounded-2xl border border-gray-700 bg-dark px-2 py-2 text-left hover:bg-gray-800 transition-colors">
                    <div className="flex items-center">
                        <Bell className="shrink-0 mx-2" />
                        <h2 className="text-sm text-ungu font-bold">
                            Notifikasi
                        </h2>
                    </div>
                    <ChevronRight className="mx-2"/>
                </button>
                <button onClick={() => navigate("/about")} className="flex items-center justify-between rounded-2xl border border-gray-700 bg-dark px-2 py-2 text-left hover:bg-gray-800 transition-colors">
                    <div className="flex items-center">
                        <Info className="shrink-0 mx-2" />
                        <h2 className="text-sm text-ungu font-bold">
                            Tentang Aplikasi
                        </h2>
                    </div>
                    <ChevronRight className="mx-2"/>
                </button>
                <button onClick={() => navigate("")} className="flex items-center justify-between rounded-2xl border border-gray-700 bg-dark px-2 py-2 text-left hover:bg-gray-800 transition-colors">
                    <div className="flex items-center">
                        <LogOut className="shrink-0 mx-2 text-red-500" />
                        <h2 className="text-sm text-red-500 font-bold">
                            Keluar
                        </h2>
                    </div>
                    <ChevronRight className="mx-2"/>
                </button>
                
            </div>
            <BottomNavbar />
        </div>
    );
}
