import { useNavigate, useOutletContext } from "react-router";
import BottomNavbar from "../../components/bottomnavbar";
import { useEffect, useState } from "react";
import { BanknoteArrowUp, Bell, ChevronRight, HandCoins, Info, LogOut, QrCode, Settings } from "lucide-react";
import { getCsrfToken } from "../../lib/api";

export default function Profile() {
    const user = useOutletContext();
    const [selectedNominal, setSelectedNominal] = useState(null);
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [nominal, setNominal] = useState("");
    const initial = (user?.fullName?.trim()?.[0] ?? "U").toUpperCase();
    const navigate = useNavigate();
    const [loggingOut, setLogginOut] = useState(false);
    const [logoutError, setLogoutError] = useState("");
    const formatNominal = (value) => {
        const angka = String(value).replace(/\D/g, "");
        return angka ? new Intl.NumberFormat("id-ID").format(Number(angka)) : "";
    };
    const [topupLoading, setTopupLoading] = useState(false);
    const [topupError, setTopupError] = useState("");
    const [balance, setBalance] = useState(0);

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

    async function handleCreateTopup() {
        const amount = Number(nominal);

        if (!Number.isInteger(amount) || amount < 10000) {
            setTopupError("Minimal top up Rp10.000.");
            return;
        }

        setTopupLoading(true);
        setTopupError("");

        try {
            const csrfToken = await getCsrfToken();

            const response = await fetch("/api/payments/duitku/topups", {
                method: "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({ amount }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message ?? "Gagal membuat pembayaran.");
            }

            window.location.assign(data.payment_url);
        } catch (error) {
            setTopupError(error.message ?? "Gagal terhubung ke server.");
        } finally {
            setTopupLoading(false);
        }
    }


    async function handleLogout() {
        if(loggingOut) return;

        setLogginOut(true);
        setLogoutError("")

        try {
            const csrfToken = await getCsrfToken();

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
            navigate("/login", {replace: true});
        } catch(error) {
            setLogoutError(error.message ?? "Gagal terhubung ke server.");
        } finally {
            setLogginOut(false);
        }
    }

    useEffect(() => {
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
                { type: "google-login-success" },
                window.location.origin
            );
        }
    }, []);

    useEffect(() => {
        if (isTopUpOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
        }, [isTopUpOpen]);

    useEffect(() => {
        fetch("/api/wallet", {
            credentials: "include",
            headers: { Accept: "application/json" },
        })
            .then((response) => response.json())
            .then((data) => setBalance(data.balance ?? 0))
            .catch(() => setBalance(0));
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
                <div className="flex items-center justify-between rounded-2xl border border-gray-700 bg-dark p-4">
                    <div className="">
                        <p className="text-xs text-gray-400">
                            SALDO AKTIF
                        </p>
                        <h1 className="font-bold text-unguterang text-2xl">
                            Rp {formatNominal(balance)}
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

            {/* Buat topup */}
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
                            type="text"
                            min="0"
                            inputMode="numeric"
                            value={formatNominal(nominal)}
                            onChange={(event) => {
                                setNominal(event.target.value.replace(/\D/g, ""));
                                setSelectedNominal(null);
                            }}
                            placeholder="0"
                            className="w-full bg-transparent text-3xl font-bold text-white outline-none placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                        {[10000, 25000, 50000, 100000, 250000, 500000].map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => {
                            setNominal(value);
                            setSelectedNominal(value);
                            }}
                            className={`rounded-full border px-5 py-2.5 text-base transition ${
                            selectedNominal === value
                                ? "border-ungu text-ungu font-bold"
                                : "border-zinc-700 text-white"
                            }`}>
                            {value / 1000}rb
                        </button>
                        ))}
                    </div>

                    <h3 className="mt-6 text-lg font-bold text-white">Pilih metode pembayaran</h3>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={handleCreateTopup}
                            disabled={topupLoading}
                            className="rounded-3xl bg-[#101014] p-5 text-left disabled:cursor-not-allowed disabled:opacity-50">
                            <QrCode size={30} />
                            <p className="text-lg font-bold text-white">
                                {topupLoading ? "Menyiapkan pembayaran..." : "QRIS"}
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                                Scan dan bayar langsung
                            </p>
                        </button>
                    </div>
                    {topupError && (
                        <p role="alert" className="mt-3 text-sm text-red-400">
                            {topupError}
                        </p>
                    )}
                    </div>
                </div>
                )}
        </div>
    );
}
