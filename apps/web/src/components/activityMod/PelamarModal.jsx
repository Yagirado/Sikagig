import { useState, useEffect } from "react";
import { X, Check, AlertCircle, MessageSquare, CheckCircle2, Maximize2, ExternalLink, FileText, ShieldCheck, Wallet } from "lucide-react";
import { useNavigate } from "react-router";
import { getCsrfToken } from "../../lib/api";
import { safeExternalUrl } from "../../lib/safeExternalUrl";

const getProofUrl = (proposalId) => proposalId ? `/api/proposals/${proposalId}/proof` : "";

function ProofLightbox({ photoUrl, onClose }) {
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4"
            onClick={onClose}
        >
            <button
                type="button"
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10 transition-colors"
                onClick={onClose}
            >
                <X size={20} />
            </button>

            <div className="max-w-[90vw] max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
                <img
                    src={photoUrl}
                    alt="Preview Bukti Pengerjaan"
                    className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-gray-800"
                />
            </div>
        </div>
    );
}

const isImageFile = (filePath) => {
    if (!filePath) return false;
    const ext = filePath.split(".").pop().toLowerCase();
    return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
};

export default function PelamarModal({ gigId, onClose, onRefresh }) {
    const [gigData, setGigData] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);
    const [confirmApproveTarget, setConfirmApproveTarget] = useState(null);
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

    // PEMILIK GIG MENYETUJUI HASIL PEKERJAAN (MODAL CUSTOM KONFIRMASI)
    const executeApprove = async () => {
        if (!confirmApproveTarget) return;
        const proposalId = confirmApproveTarget.id;
        setActionLoadingId(proposalId);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch(`/api/proposals/${proposalId}/approve`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Gagal menyetujui pekerjaan.");
            }

            setProposals((prev) =>
                prev.map((p) =>
                    p.id === proposalId
                        ? {
                              ...p,
                              status: "completed",
                              submission_status: "completed",
                              progress: 100,
                          }
                        : p
                )
            );
            setConfirmApproveTarget(null);
            setSuccessMsg(data.message || "Pekerjaan disetujui dan dana escrow telah dibagikan.");
            onRefresh?.();
        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <>
            {/* MODAL KONFIRMASI PERSETUJUAN PEKERJAAN (CUSTOM MODERN DIALOG) */}
            {confirmApproveTarget && (
                <div
                    className="fixed inset-0 z-[250] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
                    onClick={() => {
                        if (!actionLoadingId) setConfirmApproveTarget(null);
                    }}
                >
                    <div
                        className="w-full max-w-sm bg-[#16161d] border border-gray-800 rounded-3xl p-5 sm:p-6 text-white shadow-2xl space-y-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* ICON HEADER */}
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                                <CheckCircle2 size={30} className="stroke-[2.2]" />
                            </div>
                            <h3 className="text-base font-black text-white">Setujui Hasil Pekerjaan?</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Pastikan bukti pengerjaan dari pelamar sudah kamu periksa dan sesuai dengan arahan tugas.
                            </p>
                        </div>

                        {/* DETAIL PEKERJA & NOMINAL */}
                        <div className="bg-[#111116] border border-gray-800 rounded-2xl p-3.5 space-y-2 text-xs text-left">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
                                <span className="text-gray-400 text-[11px]">Pekerja:</span>
                                <span className="font-bold text-white text-right truncate max-w-[170px]">
                                    {confirmApproveTarget.student_name || confirmApproveTarget.user?.fullName}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-[11px] flex items-center gap-1">
                                    <Wallet size={12} className="text-emerald-400" /> Dana Escrow:
                                </span>
                                <span className="font-black text-emerald-400 text-sm">
                                    Rp {Number(confirmApproveTarget.bid_amount).toLocaleString("id-ID")}
                                </span>
                            </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-2 text-left">
                            <ShieldCheck size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                            <span>Dana pembayaran di atas akan langsung dilepas dan masuk ke saldo dompet pekerja.</span>
                        </div>

                        {/* TOMBOL AKSI */}
                        <div className="flex items-center gap-2.5 pt-1">
                            <button
                                type="button"
                                disabled={actionLoadingId === confirmApproveTarget.id}
                                onClick={() => setConfirmApproveTarget(null)}
                                className="w-1/2 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={actionLoadingId === confirmApproveTarget.id}
                                onClick={executeApprove}
                                className="w-1/2 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-green-500 hover:opacity-95 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                {actionLoadingId === confirmApproveTarget.id ? (
                                    <span>Memproses...</span>
                                ) : (
                                    <>
                                        <Check size={14} />
                                        <span>Ya, Setujui</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {previewPhotoUrl && (
                <ProofLightbox
                    photoUrl={previewPhotoUrl}
                    onClose={() => setPreviewPhotoUrl(null)}
                />
            )}

            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
                <div className="w-full max-w-md bg-[#18181b] border border-gray-800 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col text-white shadow-2xl overflow-hidden">

                    {/* HEADER MODAL */}
                    <div className="p-5 border-b border-gray-800 shrink-0">
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
                    <div className="p-4 overflow-y-auto flex-1 space-y-3 hide-scrollbar">
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
                            const isAccepted = item.status === "accepted" || item.status === "in_progress" || item.status === "completed";
                            const isUnderReview = item.submission_status === "under_review";
                            const isCompleted = item.submission_status === "completed" || item.status === "completed";
                            const isPhoto = isImageFile(item.proof_file);

                            return (
                                <div
                                    key={item.id}
                                    className={`p-4 rounded-2xl border ${
                                        isCompleted
                                            ? "bg-green-500/5 border-green-500/30"
                                            : isUnderReview
                                            ? "bg-amber-500/5 border-amber-500/30"
                                            : isAccepted
                                            ? "bg-ungu/10 border-ungu/40"
                                            : "bg-[#141416] border-gray-800"
                                    } flex flex-col gap-3`}
                                >
                                    {/* PROFIL PELAMAR */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-sm text-white">
                                                {item.student_name || item.user?.fullName || "Anonim"}
                                            </h3>
                                            <p className="text-[11px] text-gray-400">
                                                NPM / NIM: <span className="text-gray-200 font-medium">{item.student_nim || item.user?.NIM || item.user?.nim || "-"}</span>
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
                                        <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line italic">
                                            &quot;{item.cover_letter}&quot;
                                        </p>
                                    </div>

                                    {/* STEPPER TRACKING & BUKTI JIKA SUDAH DITERIMA */}
                                    {isAccepted && (
                                        <div className="p-3.5 bg-[#121216] rounded-2xl border border-gray-800 space-y-3">
                                            {/* STEPPER HEADER */}
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-ungu/30 text-unguterang text-[10px] font-black flex items-center justify-center">
                                                        1
                                                    </span>
                                                    <span className="font-extrabold text-white text-xs">Tracking Pengerjaan</span>
                                                </div>
                                                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                                    isCompleted
                                                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                                        : isUnderReview
                                                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                                        : "bg-ungu/20 text-unguterang border border-ungu/30"
                                                }`}>
                                                    {isCompleted ? "Disetujui" : isUnderReview ? "Menunggu Review Kamu" : "Spot Diambil"}
                                                </span>
                                            </div>

                                            {/* STEPPER VISUAL TIMELINE */}
                                            <div className="relative pt-2 pb-1">
                                                <div className="flex items-center justify-between relative z-10 px-1">
                                                    {/* STEP 1: AMBIL SPOT */}
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-5 h-5 rounded-full bg-unguterang text-black flex items-center justify-center text-[10px] font-black shadow-md shadow-ungu/40">
                                                            ✓
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-300 mt-1">Ambil Spot</span>
                                                    </div>

                                                    {/* LINE 1-2 */}
                                                    <div className={`flex-1 h-0.5 mx-1.5 -mt-3.5 transition-all ${
                                                        isUnderReview || isCompleted ? "bg-unguterang" : "bg-gray-700"
                                                    }`} />

                                                    {/* STEP 2: KIRIM BUKTI */}
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                                            isUnderReview || isCompleted
                                                                ? "bg-unguterang text-black shadow-md shadow-ungu/40"
                                                                : "border-2 border-unguterang bg-[#18181e] text-unguterang"
                                                        }`}>
                                                            {isUnderReview || isCompleted ? "✓" : "2"}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-300 mt-1">
                                                            Kirim Bukti
                                                        </span>
                                                    </div>

                                                    {/* LINE 2-3 */}
                                                    <div className={`flex-1 h-0.5 mx-1.5 -mt-3.5 transition-all ${
                                                        isCompleted ? "bg-unguterang" : isUnderReview ? "bg-gradient-to-r from-unguterang to-gray-700" : "bg-gray-700"
                                                    }`} />

                                                    {/* STEP 3: REVIEW */}
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                                            isCompleted
                                                                ? "bg-unguterang text-black shadow-md shadow-ungu/40"
                                                                : isUnderReview
                                                                ? "border-2 border-amber-400 bg-[#18181e] text-amber-400 animate-pulse"
                                                                : "border border-gray-700 bg-gray-800 text-gray-500"
                                                        }`}>
                                                            {isCompleted ? "✓" : "3"}
                                                        </div>
                                                        <span className={`text-[10px] font-bold mt-1 ${isUnderReview ? "text-amber-400 font-bold" : "text-gray-400"}`}>
                                                            Review
                                                        </span>
                                                    </div>

                                                    {/* LINE 3-4 */}
                                                    <div className={`flex-1 h-0.5 mx-1.5 -mt-3.5 transition-all ${
                                                        isCompleted ? "bg-unguterang" : "bg-gray-700"
                                                    }`} />

                                                    {/* STEP 4: SELESAI */}
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                                            isCompleted
                                                                ? "bg-green-500 text-black shadow-md shadow-green-500/40"
                                                                : "border border-gray-700 bg-gray-800 text-gray-500"
                                                        }`}>
                                                            {isCompleted ? "✓" : "4"}
                                                        </div>
                                                        <span className={`text-[10px] font-bold mt-1 ${isCompleted ? "text-green-400" : "text-gray-400"}`}>
                                                            Selesai
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* BUKTI PEKERJAAN YANG DITINJAU */}
                                            {isUnderReview || isCompleted ? (
                                                <div className="bg-[#18181f] p-3.5 rounded-xl border border-gray-800 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-unguterang block">
                                                            Hasil Bukti Pengerjaan
                                                        </span>
                                                        <span className="text-[10px] font-semibold text-gray-400 bg-white/5 border border-gray-800 px-2 py-0.5 rounded-md">
                                                            {item.student_name || item.user?.fullName} • NPM: {item.student_nim || item.user?.NIM || item.user?.nim || "-"}
                                                        </span>
                                                    </div>

                                                    {/* PREVIEW FOTO / FILE DENGAN SCROLL SAMPING (GALLERY SEPERTI DETAIL GIG) */}
                                                    {item.proof_file && (
                                                        <div className="space-y-1.5">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                                                Lampiran Bukti:
                                                            </span>
                                                            {isPhoto ? (
                                                                <div className="flex overflow-x-auto gap-3 pb-1 hide-scrollbar">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPreviewPhotoUrl(getProofUrl(item.id))}
                                                                        className="relative shrink-0 w-28 h-28 rounded-2xl overflow-hidden border border-gray-800 bg-[#16161c] group active:scale-95 transition-transform cursor-pointer"
                                                                    >
                                                                        <img
                                                                            src={getProofUrl(item.id)}
                                                                            alt="Bukti Pekerjaan"
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                            onError={(e) => {
                                                                                e.currentTarget.style.display = "none";
                                                                            }}
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                                                            <div className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white">
                                                                                <Maximize2 size={12} />
                                                                            </div>
                                                                        </div>
                                                                        <div className="absolute bottom-1.5 left-1.5 right-1.5 px-1 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] font-bold text-gray-200 text-center truncate">
                                                                            Lihat Preview
                                                                        </div>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-between p-3 rounded-xl bg-[#121215] border border-gray-800">
                                                                    <div className="flex items-center gap-2.5 truncate">
                                                                        <div className="w-9 h-9 rounded-lg bg-ungu/20 text-unguterang flex items-center justify-center shrink-0">
                                                                            <FileText size={18} />
                                                                        </div>
                                                                        <div className="text-xs truncate">
                                                                            <span className="text-white font-bold block truncate">Dokumen Bukti Terlampir</span>
                                                                            <span className="text-gray-400 text-[10px] uppercase block">{item.proof_file.split('.').pop()} File</span>
                                                                        </div>
                                                                    </div>
                                                                    <a
                                                                        href={getProofUrl(item.id)}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-gray-700 text-unguterang text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                                                                    >
                                                                        <span>Buka File</span>
                                                                        <ExternalLink size={12} />
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* LINK TUGAS */}
                                                    {safeExternalUrl(item.proof_link) && (
                                                        <div className="p-3 rounded-xl bg-[#121215] border border-gray-800 space-y-1.5">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                                                Tautan Link Tugas:
                                                            </span>
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-xs text-unguterang font-medium truncate underline decoration-unguterang/50">
                                                                    {item.proof_link}
                                                                </span>
                                                                <a
                                                                    href={safeExternalUrl(item.proof_link)}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="px-3 py-1.5 rounded-lg bg-ungu/20 hover:bg-ungu/30 border border-ungu/40 text-unguterang text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                                                                >
                                                                    <span>Buka Link</span>
                                                                    <ExternalLink size={12} />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* CATATAN PEKERJA */}
                                                    {item.proof_notes && (
                                                        <div className="p-3 rounded-xl bg-[#121215] border border-gray-800 space-y-1">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                                                Catatan Pekerja:
                                                            </span>
                                                            <p className="text-xs text-gray-300 italic">
                                                                &quot;{item.proof_notes}&quot;
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-gray-400 italic">
                                                    ⏳ Pelamar sedang mengerjakan tugas & belum mengirim form bukti.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* STATUS / TOMBOL AKSI */}
                                    <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                                        <span
                                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                                isCompleted
                                                    ? "bg-green-500/20 text-green-400"
                                                    : isUnderReview
                                                    ? "bg-amber-500/20 text-amber-400"
                                                    : isAccepted
                                                    ? "bg-blue-500/20 text-blue-400"
                                                    : item.status === "rejected"
                                                    ? "bg-red-500/20 text-red-400"
                                                    : "bg-yellow-500/20 text-yellow-400"
                                            }`}
                                        >
                                            {isCompleted
                                                ? "Selesai & Disetujui"
                                                : isUnderReview
                                                ? "Menunggu Review Kamu"
                                                : isAccepted
                                                ? "Sedang Dikerjakan"
                                                : item.status === "rejected"
                                                ? "Ditolak"
                                                : "Menunggu"}
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
                                                    className="px-4 py-1.5 text-xs font-bold text-white bg-ungu rounded-xl active:bg-unguterang active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-ungu/20"
                                                >
                                                    <Check size={14} />
                                                    Terima
                                                </button>
                                            </div>
                                        )}

                                        {isAccepted && (
                                            <div className="flex items-center gap-2">
                                                {isUnderReview && (
                                                    <button
                                                        disabled={actionLoadingId === item.id}
                                                        onClick={() => setConfirmApproveTarget(item)}
                                                        className="px-3.5 py-1.5 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-green-500 rounded-xl active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-green-500/20 cursor-pointer"
                                                    >
                                                        <Check size={14} />
                                                        <span>Setujui Pekerjaan</span>
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const convId = item.conversation?.id || item.conversation_id;
                                                        onClose();
                                                        if (convId) {
                                                            navigate(`/chats/room/${convId}`);
                                                        } else {
                                                            navigate("/chats");
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-bold text-unguterang bg-ungu/15 border border-ungu/30 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 hover:bg-ungu/25"
                                                >
                                                    <MessageSquare size={14} />
                                                    <span>Chat {item.user?.fullName ? item.user.fullName.split(" ")[0] : "Pelamar"}</span>
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
        </>
    );
}
