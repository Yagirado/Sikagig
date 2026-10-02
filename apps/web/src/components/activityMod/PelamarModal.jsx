import { useState, useEffect } from "react";
import { X, Check, AlertCircle, MessageSquare, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router";
import { getCsrfToken } from "../../lib/api";

export default function PelamarModal({ gigId, onClose, onRefresh }) {
    const [gigData, setGigData] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const navigate = useNavigate();

    // AMBIL DAFTAR PELAMAR DARI BACKEND
    useEffect(() => {
        const controller = new AbortController();

        async function fetchProposals() {
            try {
                const res = await fetch(
                    `/api/gigs/${gigId}/proposals`,
                    {
                        credentials: "include",
                        headers: { Accept: "application/json" },
                        signal: controller.signal,
                    }
                );

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(
                        data.message || "Gagal memuat pelamar."
                    );
                }

                if (!controller.signal.aborted) {
                    setProposals(data.proposals || []);
                    if (data.gig) setGigData(data.gig);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setErrorMsg(error.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void fetchProposals();

        return () => controller.abort();
    }, [gigId]);

    const maxWorkers = gigData?.mode === "barengan" ? Math.max(1, Number(gigData?.max_workers || 3)) : 1;
    const acceptedCount = proposals.filter((p) => p.status === "accepted").length;
    const isQuotaFull = acceptedCount >= maxWorkers;

    // TERIMA PELAMAR
    const handleAccept = async (proposalId) => {
        setActionLoadingId(proposalId);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const csrfToken = await getCsrfToken();

            const res = await fetch(
                `/api/proposals/${proposalId}/accept`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.message || "Gagal menerima pelamar."
                );
            }

            // Update status proposal locally
            setProposals((prev) =>
                prev.map((p) => {
                    if (p.id === proposalId) {
                        return { ...p, status: "accepted", conversation_id: data.conversation_id };
                    }
                    // Jika quota sudah penuh setelah accept ini, reject pending lainnya
                    if (data.accepted_count >= (data.max_workers || maxWorkers) && p.status === "pending") {
                        return { ...p, status: "rejected" };
                    }
                    return p;
                })
            );

            setSuccessMsg("Pekerja berhasil diterima!");
            onRefresh?.();
        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setActionLoadingId(null);
        }
    };

    // TOLAK PELAMAR
    const handleReject = async (proposalId) => {
        setActionLoadingId(proposalId);
        setErrorMsg("");
        setSuccessMsg("");
        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch(`/api/proposals/${proposalId}/reject`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
            });
            const data = await res.json();
            if (res.ok) {
                setProposals((prev) =>
                    prev.map((p) => (p.id === proposalId ? { ...p, status: "rejected" } : p))
                );
                onRefresh?.();
            } else {
                setErrorMsg(data.message || "Gagal menolak pelamar.");
            }
        } catch {
            setErrorMsg("Terjadi kesalahan jaringan.");
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
            <div className="w-full max-w-md bg-[#18181b] border border-gray-800 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col text-white">
                
                {/* HEADER MODAL */}
                <div className="p-5 border-b border-gray-800">
                    <div className="flex items-center justify-between">
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

                    {/* BADGE KUOTA PEKERJA */}
                    {gigData && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                                gigData.mode === "barengan"
                                    ? isQuotaFull
                                        ? "bg-green-500/15 border-green-500/30 text-green-400"
                                        : "bg-ungu/15 border-ungu/30 text-unguterang"
                                    : "bg-gray-800 border-gray-700 text-gray-300"
                            }`}>
                                {gigData.mode === "barengan"
                                    ? `👥 Mode Barengan: ${acceptedCount}/${maxWorkers} Pekerja Diterima`
                                    : `⚡ Mode Sendiri: ${acceptedCount}/1 Pekerja Diterima`}
                            </span>
                            {isQuotaFull && (
                                <span className="text-[11px] text-gray-400 font-medium">
                                    (Kuota Penuh)
                                </span>
                            )}
                        </div>
                    )}
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

                    {successMsg && (
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs flex items-center gap-2">
                            <CheckCircle2 size={16} />
                            {successMsg}
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

                                {/* PROGRES PEKERJA JIKA SUDAH DITERIMA */}
                                {isAccepted && (
                                    <div className="p-3 bg-[#16161a] rounded-xl border border-gray-800">
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span className="text-gray-400 font-semibold">Progres Pengerjaan</span>
                                            <span className="font-black text-unguterang">{item.progress ?? 0}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-1">
                                            <div
                                                className="h-full bg-gradient-to-r from-ungu to-green-400 rounded-full transition-all duration-300"
                                                style={{ width: `${item.progress ?? 0}%` }}
                                            />
                                        </div>
                                        {item.progress_notes && (
                                            <p className="text-[11px] text-gray-400 italic mt-1">
                                                Catatan: {item.progress_notes}
                                            </p>
                                        )}
                                    </div>
                                )}

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
                                                disabled={actionLoadingId === item.id || isQuotaFull}
                                                onClick={() => handleAccept(item.id)}
                                                className="px-4 py-1.5 text-xs font-bold text-white bg-ungu rounded-xl active:bg-unguterang active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
                                            >
                                                <Check size={14} />
                                                Terima
                                            </button>
                                        </div>
                                    )}

                                    {isAccepted && item.conversation_id && (
                                        <button
                                            onClick={() => {
                                                onClose();
                                                navigate(`/chats/room/${item.conversation_id}`);
                                            }}
                                            className="px-3 py-1.5 text-xs font-bold text-unguterang bg-ungu/15 border border-ungu/30 rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
                                        >
                                            <MessageSquare size={14} />
                                            Buka Chat
                                        </button>
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
