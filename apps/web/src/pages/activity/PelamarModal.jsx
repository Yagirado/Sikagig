import { useState, useEffect } from "react";
import { X, Check, AlertCircle } from "lucide-react";

export default function PelamarModal({ gigId, onClose, onRefresh }) {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    // AMBIL DAFTAR PELAMAR DARI BACKEND
    useEffect(() => {
        async function fetchProposals() {
            try {
                const res = await fetch(`/api/gigs/${gigId}/proposals`, {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });
                const data = await res.json();
                if (res.ok) {
                    setProposals(data.proposals || []);
                } else {
                    setErrorMsg(data.message || "Gagal memuat pelamar.");
                }
            } catch {
                setErrorMsg("Terjadi kesalahan jaringan.");
            } finally {
                setLoading(false);
            }
        }
        fetchProposals();
    }, [gigId]);

    // TERIMA PELAMAR
    const handleAccept = async (proposalId) => {
        setActionLoadingId(proposalId);
        try {
            const res = await fetch(`/api/proposals/${proposalId}/accept`, {
                method: "PATCH",
                credentials: "include",
                headers: { Accept: "application/json" },
            });
            const data = await res.json();
            if (res.ok) {
                if (onRefresh) onRefresh();
                onClose();
            } else {
                alert(data.message || "Gagal menerima pelamar.");
            }
        } catch {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setActionLoadingId(null);
        }
    };

    // TOLAK PELAMAR
    const handleReject = async (proposalId) => {
        setActionLoadingId(proposalId);
        try {
            const res = await fetch(`/api/proposals/${proposalId}/reject`, {
                method: "PATCH",
                credentials: "include",
                headers: { Accept: "application/json" },
            });
            const data = await res.json();
            if (res.ok) {
                setProposals((prev) =>
                    prev.map((p) => (p.id === proposalId ? { ...p, status: "rejected" } : p))
                );
            } else {
                alert(data.message || "Gagal menolak pelamar.");
            }
        } catch {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
            <div className="w-full max-w-md bg-[#18181b] border border-gray-800 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col text-white">
                
                {/* HEADER MODAL */}
                <div className="flex items-center justify-between p-5 border-b border-gray-800">
                    <div>
                        <h2 className="text-lg font-black">Daftar Pelamar</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Pilih jagoan terbaik untuk kerjakan Gig ini</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-gray-800 text-gray-400 active:scale-95 transition-transform"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* BODY MODAL */}
                <div className="p-4 overflow-y-auto flex-1 space-y-3">
                    {loading && (
                        <p className="text-center text-sm text-gray-400 py-8">Memuat pelamar...</p>
                    )}

                    {errorMsg && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                            <AlertCircle size={16} />
                            {errorMsg}
                        </div>
                    )}

                    {!loading && !errorMsg && proposals.length === 0 && (
                        <div className="text-center py-10">
                            <p className="font-bold text-gray-300">Belum ada pelamar</p>
                            <p className="text-xs text-gray-500 mt-1">Tawaran dari jagoan akan muncul di sini.</p>
                        </div>
                    )}

                    {proposals.map((item) => {
                        const isPending = item.status === "pending";
                        const isAccepted = item.status === "accepted";

                        return (
                            <div
                                key={item.id}
                                className={`p-4 rounded-2xl border ${
                                    isAccepted
                                        ? "bg-ungu/10 border-ungu/40"
                                        : "bg-[#141416] border-gray-800"
                                } flex flex-col gap-3`}
                            >
                                {/* PROFIL PELAMAR */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-sm text-white">
                                            {item.user?.fullName || "Anonim"}
                                        </h3>
                                        <p className="text-[11px] text-gray-400">
                                            NIM: {item.user?.nim || "-"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-gray-400 block">Tawaran Bid</span>
                                        <span className="text-sm font-black text-unguterang">
                                            Rp {Number(item.bid_amount).toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                </div>

                                {/* PESAN COVER LETTER */}
                                <div className="bg-[#1e1e24] p-3 rounded-xl border border-gray-800/80">
                                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                                        "{item.cover_letter}"
                                    </p>
                                </div>

                                {/* STATUS / TOMBOL AKSI */}
                                <div className="flex items-center justify-between pt-1">
                                    <span
                                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                            isAccepted
                                                ? "bg-green-500/20 text-green-400"
                                                : item.status === "rejected"
                                                ? "bg-red-500/20 text-red-400"
                                                : "bg-yellow-500/20 text-yellow-400"
                                        }`}
                                    >
                                        {isAccepted ? "Diterima" : item.status === "rejected" ? "Ditolak" : "Menunggu"}
                                    </span>

                                    {isPending && (
                                        <div className="flex gap-2">
                                            <button
                                                disabled={actionLoadingId === item.id}
                                                onClick={() => handleReject(item.id)}
                                                className="px-3 py-1.5 text-xs font-bold text-red-400 bg-red-500/10 rounded-xl border border-red-500/20 active:scale-95 disabled:opacity-50 transition-all"
                                            >
                                                Tolak
                                            </button>
                                            <button
                                                disabled={actionLoadingId === item.id}
                                                onClick={() => handleAccept(item.id)}
                                                className="px-4 py-1.5 text-xs font-bold text-white bg-ungu rounded-xl active:bg-unguterang active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
                                            >
                                                <Check size={14} />
                                                Terima
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
