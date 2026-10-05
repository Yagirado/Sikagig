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

const withdrawalStatusLabel = {
    pending: "Sedang diproses",
    processed: "Berhasil dicairkan",
    rejected: "Ditolak",
};

export default function HistoryTransaksi() {
    const navigate = useNavigate();
    const [topups, setTopups] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [walletTransactions, setWalletTransactions] = useState([]);
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
                const [topupResponse, withdrawalResponse, transactionResponse] = await Promise.all([
                    fetch("/api/payments/duitku/topups", {
                        credentials: "include",
                        headers: { Accept: "application/json" },
                    }),
                    fetch("/api/withdrawals", {
                        credentials: "include",
                        headers: { Accept: "application/json" },
                    }),
                    fetch("/api/wallet-transactions", {
                        credentials: "include",
                        headers: { Accept: "application/json" },
                    }),
                ]);

                const data = await topupResponse.json();
                const withdrawalData = await withdrawalResponse.json();
                const transactionData = await transactionResponse.json();

                if (!topupResponse.ok || !withdrawalResponse.ok || !transactionResponse.ok) {
                    throw new Error(
                        data.message ?? withdrawalData.message ?? transactionData.message ?? "Gagal memuat riwayat transaksi."
                    );
                }

                setTopups(data.topups ?? []);
                setWithdrawals(withdrawalData.withdrawals ?? []);
                setWalletTransactions(transactionData.transactions ?? []);
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

    const historyItems = [
        ...topups.map((topup) => ({
            id: `topup-${topup.id}`,
            createdAt: topup.created_at,
            title: "Top Up Wallet",
            amount: topup.amount,
            direction: "credit",
            status: statusLabel[topup.status] ?? topup.status,
            statusTone: topup.status === "paid" ? "success" : topup.status === "pending" ? "pending" : "failed",
            detail: `${topup.payment_method} - ${topup.merchant_order_id}`,
            paymentUrl: topup.status === "pending" ? topup.payment_url : null,
        })),
        ...withdrawals.map((withdrawal) => ({
            id: `withdrawal-${withdrawal.id}`,
            createdAt: withdrawal.created_at,
            title: `Tarik Dana ${withdrawal.provider}`,
            amount: withdrawal.amount,
            direction: "debit",
            status: withdrawalStatusLabel[withdrawal.status] ?? withdrawal.status,
            statusTone: withdrawal.status === "processed" ? "success" : withdrawal.status === "pending" ? "pending" : "failed",
            detail: `${withdrawal.destination_type === "bank" ? "Rekening" : "Nomor telepon"} - ${withdrawal.destination_number}`,
        })),
        ...walletTransactions.map((transaction) => ({
            id: `wallet-${transaction.id}`,
            createdAt: transaction.created_at,
            title: transaction.title,
            amount: transaction.amount,
            direction: transaction.direction,
            status: "Berhasil",
            statusTone: "success",
            detail: transaction.description,
        })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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

                {!loading && !error && historyItems.length === 0 && (
                    <p className="rounded-2xl border border-gray-700 bg-dark p-5 text-center text-sm text-gray-400">
                        Belum ada riwayat transaksi
                    </p>
                )}
                

                <div className="flex flex-col gap-3">
                    {historyItems.map((item) => (
                        <article
                            key={item.id}
                            className="rounded-2xl border border-gray-700 bg-dark p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-bold text-white">
                                        {item.title}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">
                                        {new Date(
                                            item.createdAt
                                        ).toLocaleString("id-ID")}
                                    </p>
                                </div>

                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                                        item.statusTone === "success"
                                            ? "bg-green-500/15 text-green-400"
                                            : item.statusTone === "pending"
                                            ? "bg-yellow-500/15 text-yellow-400"
                                            : "bg-red-500/15 text-red-400"
                                    }`}>
                                    {item.status}
                                </span>
                            </div>

                            <p className={`mt-4 text-lg font-extrabold ${item.direction === "credit" ? "text-unguterang" : "text-red-400"}`}>
                                {item.direction === "credit" ? "+" : "-"} Rp {formatRupiah(item.amount)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                {item.detail}
                            </p>
                            {item.paymentUrl && (
                                <button
                                    type="button"
                                    onClick={() => window.location.assign(item.paymentUrl)}
                                    className="mt-4 w-full rounded-xl bg-ungu px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale">
                                    Lanjutkan Pembayaran
                                </button>
                            )}
                        </article>
                    ))}
                </div>
            </main>
        </div>
    );
}
