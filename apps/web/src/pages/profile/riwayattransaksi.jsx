import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID").format(Number(value ?? 0));

const statusLabel = {
    paid: "Berhasil",
    pending: "Menunggu pembayaran",
    failed: "Gagal",
    expired: "Kedaluwarsa",
};

export default function HistoryTransaksi() {
    const navigate = useNavigate();
    const [topups, setTopups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
        const formatNominal = (value) => {
        const angka = String(value).replace(/\D/g, "");
        return angka ? new Intl.NumberFormat("id-ID").format(Number(angka)) : "";
    };
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        async function loadHistory() {
            try {
                const response = await fetch("/api/payments/duitku/topups", {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ?? "Gagal memuat riwayat transaksi."
                    );
                }
                setTopups(data.topups ?? []);
            } catch (requestError) {
                setError(
                    requestError.message ?? "Gagal terhubung ke server."
                );
            } finally {
                setLoading(false);
            }
        }
        loadHistory();
    }, []);

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
            <header className="sticky top-0 z-10 -mx-6 bg-[#151515] px-6 py-2.5">
                <div className="relative flex items-center justify-center py-2">
                    <h1 className="text-lg font-black">
                        Riwayat Transaksi
                    </h1>
                    <button onClick={() => navigate("/profile")} className="absolute left-0 p-2.5 rounded-2xl bg-neutral-900 border border-gray-700 text-gray-300 active:bg-gray-800 transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-gray-700 bg-dark p-4">
                    <div className="">
                        <p className="text-xs text-gray-400">
                            Saldo Anda Saat Ini
                        </p>
                        <h1 className="font-bold text-unguterang text-2xl">
                            Rp {formatNominal(balance)}
                        </h1>
                    </div>
                </div>
            </header>

            <main className="pt-5">
                {loading && (
                    <p className="py-8 text-center text-sm text-gray-400">
                        Memuat riwayat...
                    </p>
                )}

                {error && (
                    <p className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-400">
                        {error}
                    </p>
                )}

                {!loading && !error && topups.length === 0 && (
                    <p className="rounded-2xl border border-gray-700 bg-dark p-5 text-center text-sm text-gray-400">
                        Belum ada riwayat top up
                    </p>
                )}
                

                <div className="flex flex-col gap-3">
                    {topups.map((topup) => (
                        <article
                            key={topup.id}
                            className="rounded-2xl border border-gray-700 bg-dark p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-bold text-white">
                                        Top Up Wallet
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">
                                        {new Date(
                                            topup.created_at
                                        ).toLocaleString("id-ID")}
                                    </p>
                                </div>

                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                                        topup.status === "paid"
                                            ? "bg-green-500/15 text-green-400"
                                            : topup.status === "pending"
                                            ? "bg-yellow-500/15 text-yellow-400"
                                            : "bg-red-500/15 text-red-400"
                                    }`}>
                                    {statusLabel[topup.status] ?? topup.status}
                                </span>
                            </div>

                            <p className="mt-4 text-lg font-extrabold text-unguterang">
                                + Rp {formatRupiah(topup.amount)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                {topup.payment_method} &middot; {topup.merchant_order_id}
                            </p>
                        </article>
                    ))}
                </div>
            </main>
        </div>
    );
}