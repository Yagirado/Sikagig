import { useNavigate } from "react-router";
import BottomNavbar from "../../components/bottomnavbar";
import { useEffect, useState } from "react";
import { BanknoteArrowUp, Bell, ChevronRight, HandCoins, Info, LogOut, Settings } from "lucide-react";
import { getCsrfToken } from "../../lib/api";

export default function Profile() {
    const [user, setUser] = useState(null);
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [nominal, setNominal] = useState("");
    const initial = (user?.fullName?.trim()?.[0] ?? "U").toUpperCase();
    const navigate = useNavigate();
    const [loggingOut, setLogginOut] = useState(false);
    const [logoutError, setLogoutError] = useState("");

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

    async function handleLogout() {
        if(loggingOut) return;

        setLogginOut(true);
        setLogoutError("")

        try {
            const csrfToken = getCsrfToken();

            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                }
            });

            if(!response.ok && response.status !== 401) {
                const data = await response.json();

                throw new Error(data?.message ?? "Gagal Logout. silahkan coba lagi.") 
            }
            setUser(null);
            navigate("/login", {replace: true});
        } catch(error) {
            setLogoutError(error.message ?? "Gagal terhubung ke server.");
        } finally {
            setLogginOut(false);
        }
    }

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

    useEffect(() => {
        if (isTopUpOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            // Kembalikan scroll seperti semula
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
        }, [isTopUpOpen]);
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
                <div className="flex items-center justify-between rounded-2xl border border-gray-700 bg-dark p-4">
                    <div className="">
                        <p className="text-xs text-gray-400">
                            SALDO AKTIF
                        </p>
                        <h1 className="font-bold text-unguterang text-2xl">
                            Rp 0
                        </h1>
                    </div>
                    <button type="button" onClick={() => setIsTopUpOpen(true)} className="rounded-full bg-ungu px-3 py-2 text-sm font-bold text-white transition hover:brightness-110 active:scale-95">
                        + Top Up
                    </button>
                </div>

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

                <button 
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut} 
                    className="flex items-center justify-between rounded-2xl border border-gray-700 bg-dark px-2 py-2 text-left hover:bg-gray-800 transition-colors">
                    <div className="flex items-center">
                        <LogOut className="shrink-0 mx-2 text-red-500" />
                        <h2 className="text-sm text-red-500 font-bold">
                            Keluar
                        </h2>
                    </div>
                    <ChevronRight className="mx-2"/>
                </button>
                {logoutError && (
                    <p role="alert" className="text-sm text-red-500">
                        {logoutError}
                    </p>
                )}
            </div>
            <BottomNavbar />

            {isTopUpOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
                    onClick={() => setIsTopUpOpen(false)}>
                    <div className="w-full max-w-md max-h-[90vh] rounded-t-4xl bg-[#18181b] px-6 pb-8 pt-3"
                        onClick={(event) => event.stopPropagation()}>
                    <div className="mx-auto mb-7 h-1.5 w-14 rounded-full bg-zinc-700" />

                    <h2 className="text-2xl font-bold text-white">Top Up Wallet</h2>
                    <p className="text-lg text-gray-300">Masukkan nominal top up</p>

                    <div className="mt-5 flex cursor-text items-center rounded-3xl border border-zinc-700 px-3 py-3 focus-within:bg-gray-800"
                        onClick={() => document.getElementById('nominal-input')?.focus()}>
                        <span className="text-3xl font-bold text-unguterang px-2">Rp </span>
                        <input
                            id="nominal-input"
                            type="number"
                            min="0"
                            value={nominal}
                            onChange={(event) => setNominal(event.target.value)}
                            placeholder="0"
                            className="w-full bg-transparent text-3xl font-bold text-white outline-none placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                        {[10000, 25000, 50000, 100000, 250000, 500000].map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setNominal(value)}
                            className="rounded-full border border-zinc-700 px-5 py-2.5 text-base text-white transition hover:border-ungu hover:text-ungu">
                            {value / 1000}rb
                        </button>
                        ))}
                    </div>

                    <h3 className="mt-6 text-lg font-bold text-white">Pilih metode pembayaran</h3>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <button type="button" className="rounded-3xl bg-[#101014] p-5 text-left">
                            <p className="text-lg font-bold text-white">QRIS</p>
                            <p className="mt-2 text-sm text-gray-400">Scan dan bayar langsung</p>
                        </button>
                        <button type="button" className="rounded-3xl bg-[#101014] p-5 text-left">
                            <p className="text-lg font-bold text-white">E-Wallet</p>
                            <p className="mt-2 text-sm text-gray-400">Bayar lewat Mayar</p>
                        </button>
                    </div>
                    </div>
                </div>
                )}
        </div>
    );
}
