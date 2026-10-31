import { ArrowLeft, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useOutletContext } from "react-router";
import { getCsrfToken } from "../../lib/api";

const formatRupiah = (value) => new Intl.NumberFormat("id-ID").format(Number(value ?? 0));

export default function AdminWithdrawals() {
    const user = useOutletContext();
    const navigate = useNavigate();
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState(null);

    async function loadWithdrawals() {
        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/admin/withdrawals", {
                credentials: "include",
                headers: { Accept: "application/json" },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message ?? "Gagal memuat data penarikan.");
            setWithdrawals(data.withdrawals ?? []);
        } catch (requestError) {
            setError(requestError.message ?? "Gagal terhubung ke server.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user?.is_admin) {
            setTimeout(() => {
                loadWithdrawals();
            }, 0);
        }
    }, [user?.is_admin]);


    async function updateStatus(id, action) {
        const confirmed = window.confirm(
            action === "process"
                ? "Pastikan dana sudah ditransfer. Tandai penarikan ini berhasil?"
                : "Tolak penarikan ini? Saldo pengguna akan dikembalikan."
        );
        if (!confirmed) return;

        setProcessingId(id);
        setError("");
        try {
            const csrfToken = await getCsrfToken();
            const response = await fetch(`/api/admin/withdrawals/${id}/${action}`, {
                method: "PATCH",
                credentials: "include",
                headers: { Accept: "application/json", "X-CSRF-TOKEN": csrfToken },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message ?? "Gagal memperbarui penarikan.");
            setWithdrawals((current) => current.map((item) => item.id === id ? data.withdrawal : item));
        } catch (requestError) {
            setError(requestError.message ?? "Gagal terhubung ke server.");
        } finally {
            setProcessingId(null);
        }
    }

    if (!user?.is_admin) return <Navigate to="/profile" replace />;

    return (
        <div className="mobile-container min-h-screen text-white pt-1! pb-8">
            <header className="sticky top-0 z-10 -mx-6 bg-[#151515] px-6 py-2.5">
                <div className="relative flex items-center justify-center py-2">
                    <h1 className="text-lg font-black">Admin · Tarik Dana</h1>
                    <button onClick={() => navigate("/profile")} className="absolute left-0 rounded-2xl border border-gray-700 bg-neutral-900 p-2.5 text-gray-300 active:bg-gray-800 transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                </div>
            </header>

            <main className="pt-5">
                <p className="mb-4 text-sm text-gray-400">Transfer dana terlebih dahulu, lalu tandai berhasil. Penolakan akan mengembalikan saldo pengguna.</p>
                {loading && <p className="py-8 text-center text-sm text-gray-400">Memuat penarikan...</p>}
                {error && <p role="alert" className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
                {!loading && withdrawals.length === 0 && <p className="rounded-2xl border border-gray-700 bg-dark p-5 text-center text-sm text-gray-400">Belum ada permintaan tarik dana.</p>}
                
                <div className="space-y-3">
                    {withdrawals.map((withdrawal) => {
                        const pending = withdrawal.status === "pending";
                        return <article key={withdrawal.id} className="rounded-2xl border border-gray-700 bg-dark p-4">
                            
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-bold">{withdrawal.user?.fullName ?? "Pengguna"}</p>
                                    <p className="mt-1 text-xs text-gray-400">{withdrawal.user?.email}</p>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${pending ? "bg-yellow-500/15 text-yellow-400" : withdrawal.status === "processed" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{pending ? "Menunggu" : withdrawal.status === "processed" ? "Selesai" : "Ditolak"}</span>
                            </div>

                            <p className="mt-4 text-xl font-extrabold text-unguterang">Rp {formatRupiah(withdrawal.amount)}</p>
                            <p className="mt-2 text-sm text-gray-300">{withdrawal.provider} · {withdrawal.destination_number}</p>
                            <p className="mt-1 text-xs text-gray-500">a.n. {withdrawal.account_name}</p>
                            
                            {pending && <div className="mt-4 grid grid-cols-2 gap-3">
                                <button disabled={processingId === withdrawal.id} onClick={() => updateStatus(withdrawal.id, "process")} className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2.5 text-sm font-bold disabled:opacity-50">
                                    <Check size={16} />Selesaikan
                                </button>
                                <button disabled={processingId === withdrawal.id} onClick={() => updateStatus(withdrawal.id, "reject")} className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2.5 text-sm font-bold disabled:opacity-50">
                                    <X size={16} />Tolak
                                </button>
                            </div>}
                        </article>;
                    })}
                </div>
            </main>
        </div>
    );
}
