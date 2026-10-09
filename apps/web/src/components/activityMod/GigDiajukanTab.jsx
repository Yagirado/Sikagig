import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Edit3, Undo2, UserRound, Calendar, MessageSquare, Clock, FileText, Maximize2, ExternalLink, X } from "lucide-react";
import { getCategoryIcon } from "../../lib/categories";
import { getCsrfToken } from "../../lib/api";
import { safeExternalUrl } from "../../lib/safeExternalUrl";
import EditProposalModal from "./EditProposalModal";
import SubmitProofModal from "../../pages/activity/SubmitProofModal";

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

function getRemainingDaysInfo(deadlineStr) {
    if (!deadlineStr) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(deadlineStr);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { text: `Lewat deadline (${Math.abs(diffDays)} hari lalu)`, isOverdue: true };
    }
    if (diffDays === 0) {
        return { text: "Deadline Hari ini!", isToday: true };
    }
    if (diffDays === 1) {
        return { text: "Tersisa 1 hari lagi", isUrgent: true };
    }
    return { text: `Tersisa ${diffDays} hari lagi`, isNormal: true };
}

export default function GigDiajukanTab({ category = "Semua", sortOrder = "desc" }) {
    const navigate = useNavigate();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEdit, setSelectedEdit] = useState(null);
    const [selectedSubmitProof, setSelectedSubmitProof] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);

    // FETCH PROPOSAL YANG SAYA AJUKAN
    useEffect(() => {
        let ignore = false;
        async function fetchMyProposals() {
            try {
                const res = await fetch("/api/my-proposals", {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });
                const data = await res.json();
                if (!ignore && res.ok) {
                    setProposals(data.proposals || []);
                }
            } catch {
                // SILENT ERROR
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        fetchMyProposals();
        return () => {
            ignore = true;
        };
    }, [refreshKey]);

    // TARIK LAMARAN
    const handleWithdraw = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Yakin ingin menarik kembali lamaran ini?")) return;

        setActionLoadingId(id);
        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch(`/api/proposals/${id}/withdraw`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
            });
            const data = await res.json();
            if (res.ok) {
                setProposals((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, status: "withdrawn" } : p))
                );
            } else {
                alert(data.message || "Gagal menarik lamaran.");
            }
        } catch {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setActionLoadingId(null);
        }
    };

    // FILTER KATEGORI & SORTING TANGGAL
    const filteredProposals = proposals
        .filter((p) => category === "Semua" || (p.gig?.category || "").toLowerCase() === category.toLowerCase())
        .sort((a, b) => {
            const timeA = new Date(a.created_at || 0).getTime();
            const timeB = new Date(b.created_at || 0).getTime();
            return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
        });

    if (loading) {
        return <p className="text-center text-sm text-gray-400 py-12">Memuat lamaran kamu...</p>;
    }

    if (proposals.length === 0) {
        return (
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-gray-800 bg-[#161618]">
                <p className="font-bold text-gray-300">Belum ada Gig yang kamu ajukan</p>
                <p className="text-xs text-gray-500 mt-1">Cari pekerjaan yang cocok di dashboard dan ajukan penawaran.</p>
            </div>
        );
    }

    if (filteredProposals.length === 0) {
        return (
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-gray-800 bg-[#161618]">
                <p className="font-bold text-gray-300">Tidak ada penawaran untuk kategori &quot;{category}&quot;</p>
                <p className="text-xs text-gray-500 mt-1">Coba pilih kategori lain atau pilih &quot;Semua&quot;.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* DAFTAR CARD LAMARAN GIG */}
            {filteredProposals.map((item) => {
                const gigClosed = item.gig?.status === "cancelled" || item.gig?.status === "completed";
                const isAccepted = item.status === "accepted" || item.status === "in_progress" || item.status === "completed";
                const isUnderReview = item.submission_status === "under_review";
                const isCompleted = item.submission_status === "completed" || item.status === "completed";
                const isNotSubmitted = !isUnderReview && !isCompleted;
                const isRejected = item.status === "rejected";
                const isWithdrawn = item.status === "withdrawn";
                const isPending = item.status === "pending" && !gigClosed;

                const statusColor = isCompleted
                    ? "bg-green-500/15 border-green-500/60 text-green-400"
                    : isUnderReview
                    ? "bg-amber-500/15 border-amber-500/60 text-amber-400"
                    : isAccepted
                    ? "bg-ungu/15 border-ungu/60 text-unguterang"
                    : isPending
                    ? "bg-yellow-500/15 border-yellow-500/60 text-yellow-400"
                    : isWithdrawn
                    ? "bg-gray-500/15 border-gray-500/60 text-gray-400"
                    : "bg-red-500/15 border-red-500/60 text-red-400";

                const statusLabel = isCompleted
                    ? "Selesai"
                    : isUnderReview
                    ? "Menunggu Review"
                    : isAccepted
                    ? "Diterima"
                    : isPending
                    ? "Menunggu Respon"
                    : isWithdrawn
                    ? "Ditarik"
                    : gigClosed
                    ? "Ditolak / Gig Ditutup"
                    : "Ditolak";

                const formattedDate = item.created_at
                    ? new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                      })
                    : "-";

                const deadlineInfo = getRemainingDaysInfo(item.gig?.deadline);
                const formattedDeadline = item.gig?.deadline
                    ? new Date(item.gig.deadline).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                      })
                    : null;

                const isInactive = isRejected || isWithdrawn || gigClosed;

                return (
                    <article
                        key={item.id}
                        onClick={() => navigate(`/gig/${item.gig_id}`)}
                        className={`h-fit w-auto rounded-3xl border cursor-pointer active:scale-[0.99] transition-transform ${
                            isCompleted
                                ? "bg-green-500/5 border-green-500/40 shadow-none"
                                : isInactive
                                ? "bg-[#141417]/95 border-gray-800/90 shadow-none hover:border-gray-700"
                                : "bg-dark border-unguterang shadow-[0_0_16px_0] shadow-unguterang/20"
                        }`}
                    >
                        {/* KATEGORI & STATUS BADGE */}
                        <div className="flex items-center justify-between my-4 mx-4">
                            <span
                                className={`inline-flex items-center gap-4 rounded-full px-3 py-2 text-xs font-black tracking-wider ${
                                    isInactive
                                        ? "bg-white/5 text-gray-300 border border-gray-800"
                                        : "bg-light/50 text-white"
                                }`}
                            >
                                <span className="relative h-3 w-3 shrink-0 ml-1.5">
                                    <img
                                        src={getCategoryIcon(item.gig?.category)}
                                        alt=""
                                        className={`absolute left-1/2 top-1/2 h-9 w-9 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain ${
                                            isInactive ? "opacity-70 grayscale-[30%]" : ""
                                        }`}
                                    />
                                </span>
                                {item.gig?.category || "Random"}
                            </span>
                            <span className={`border uppercase tracking-wider text-[10px] font-black rounded-full px-2.5 py-1 ${statusColor}`}>
                                {statusLabel}
                            </span>
                        </div>

                        {/* JUDUL & COVER LETTER */}
                        <div className="flex flex-col gap-1 mx-4 text-white">
                            <div className="mt-2">
                                <h2 className={`wrap-break-words text-lg font-extrabold leading-snug ${
                                    isInactive ? "text-gray-300" : "text-white"
                                }`}>
                                    {item.gig?.title || "Gig"}
                                </h2>

                                {item.cover_letter && (
                                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-300 italic">
                                        &quot;{item.cover_letter}&quot;
                                    </p>
                                )}
                            </div>

                            {/* TANGGAL PENGAJUAN & DEADLINE */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-gray-400 mt-2">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={12} className="text-gray-500" />
                                    <span>Diajukan: {formattedDate}</span>
                                </div>
                                {isCompleted ? (
                                    <div className="flex items-center gap-1.5">
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                                            ✓ Gig ini telah selesai
                                        </span>
                                    </div>
                                ) : formattedDeadline && (
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={12} className={deadlineInfo?.isOverdue ? "text-red-400" : deadlineInfo?.isToday || deadlineInfo?.isUrgent ? "text-amber-400" : "text-unguterang"} />
                                        <span>Deadline: {formattedDeadline}</span>
                                        {deadlineInfo && (
                                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                                deadlineInfo.isOverdue
                                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                                    : deadlineInfo.isToday || deadlineInfo.isUrgent
                                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                                                    : "bg-ungu/20 text-unguterang border border-ungu/30"
                                            }`}>
                                                {deadlineInfo.text}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* STEPPER TRACKING JIKA SUDAH DITERIMA */}
                        {isAccepted && (
                            <div className="mx-4 mt-3 pt-3 border-t border-gray-800 space-y-3" onClick={(e) => e.stopPropagation()}>
                                <div className="bg-[#121216] border border-gray-800/90 rounded-2xl p-3.5 space-y-3">
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
                                            {isCompleted ? "Disetujui" : isUnderReview ? "Menunggu Review" : "Spot Diambil"}
                                        </span>
                                    </div>

                                    {/* INFO DEADLINE & COUNTDOWN KHUSUS DI TRACKING */}
                                    {isCompleted ? (
                                        <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-green-500/10 border border-green-500/25 text-green-400">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <span>Status: <strong className="text-green-400 font-bold">Gig ini telah selesai</strong></span>
                                            </div>
                                            <span className="font-extrabold text-[11px] tracking-wide text-green-400">
                                                ✓ Selesai
                                            </span>
                                        </div>
                                    ) : (
                                        formattedDeadline && deadlineInfo && (
                                            <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                                                deadlineInfo.isOverdue
                                                    ? "bg-red-500/10 border border-red-500/25 text-red-400"
                                                    : deadlineInfo.isToday || deadlineInfo.isUrgent
                                                    ? "bg-amber-500/10 border border-amber-500/25 text-amber-300"
                                                    : "bg-[#18181f] border border-gray-800 text-gray-300"
                                            }`}>
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <Clock size={13} className={deadlineInfo.isOverdue ? "text-red-400" : deadlineInfo.isToday || deadlineInfo.isUrgent ? "text-amber-400" : "text-unguterang"} />
                                                    <span>Deadline: <strong className="text-white font-bold">{formattedDeadline}</strong></span>
                                                </div>
                                                <span className="font-extrabold text-[11px] tracking-wide">
                                                    {deadlineInfo.text}
                                                </span>
                                            </div>
                                        )
                                    )}

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

                                            {/* STEP 2: ISI FORM / KIRIM BUKTI */}
                                            <div className="flex flex-col items-center">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                                    isUnderReview || isCompleted
                                                        ? "bg-unguterang text-black shadow-md shadow-ungu/40"
                                                        : "border-2 border-unguterang bg-[#18181e] text-unguterang"
                                                }`}>
                                                    {isUnderReview || isCompleted ? "✓" : "2"}
                                                </div>
                                                <span className={`text-[10px] font-bold mt-1 ${isNotSubmitted ? "text-unguterang" : "text-gray-300"}`}>
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
                                                <span className={`text-[10px] font-bold mt-1 ${isUnderReview ? "text-amber-400" : "text-gray-400"}`}>
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

                                    {/* BOX FORM BUKTI PEKERJAAN ATAU PREVIEW */}
                                    {isNotSubmitted ? (
                                        <div className="bg-[#18181f] border border-gray-800 rounded-xl p-3.5 space-y-2.5">
                                            <div>
                                                <span className="text-xs font-black text-white flex items-center gap-1.5">
                                                    <FileText size={13} className="text-unguterang" /> Form Bukti Pekerjaan
                                                </span>
                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                    Isi form ini untuk mengirim bukti pengerjaan tugas kepada pemilik Gig.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedSubmitProof(item);
                                                }}
                                                className="w-full py-2.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-ungu to-unguterang hover:opacity-95 active:scale-[0.98] shadow-md shadow-ungu/30 transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <span>Isi & Lengkapi Form</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-[#18181f] border border-gray-800 rounded-xl p-3.5 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                    Bukti yang Dikirimkan:
                                                </span>
                                                {!isCompleted && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedSubmitProof(item);
                                                        }}
                                                        className="text-[11px] font-bold text-unguterang hover:underline flex items-center gap-1"
                                                    >
                                                        <Edit3 size={11} /> Ubah Bukti
                                                    </button>
                                                )}
                                            </div>

                                            {item.proof_file && (
                                                <div className="space-y-1.5">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                                        Lampiran Bukti:
                                                    </span>
                                                    {isImageFile(item.proof_file) ? (
                                                        <div className="flex overflow-x-auto gap-3 pb-1 hide-scrollbar">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPreviewPhotoUrl(getProofUrl(item.id));
                                                                }}
                                                                className="relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden border border-gray-800 bg-[#16161c] group active:scale-95 transition-transform cursor-pointer text-left"
                                                            >
                                                                <img
                                                                    src={getProofUrl(item.id)}
                                                                    alt="Bukti"
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                />
                                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                                                    <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white">
                                                                        <Maximize2 size={11} />
                                                                    </div>
                                                                </div>
                                                                <div className="absolute bottom-1 left-1 right-1 px-1 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[8px] font-bold text-gray-200 text-center truncate">
                                                                    Preview
                                                                </div>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121215] border border-gray-800">
                                                            <div className="flex items-center gap-2 truncate">
                                                                <div className="w-8 h-8 rounded-lg bg-ungu/20 text-unguterang flex items-center justify-center shrink-0">
                                                                    <FileText size={16} />
                                                                </div>
                                                                <div className="text-xs truncate">
                                                                    <span className="text-white font-bold block truncate text-[11px]">File Dokumen Bukti</span>
                                                                    <span className="text-gray-400 text-[9px] uppercase block">{item.proof_file.split('.').pop()} File</span>
                                                                </div>
                                                            </div>
                                                            <a
                                                                href={getProofUrl(item.id)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-gray-700 text-unguterang text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors"
                                                            >
                                                                <span>Buka</span>
                                                                <ExternalLink size={10} />
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {safeExternalUrl(item.proof_link) && (
                                                <div className="p-2.5 rounded-xl bg-[#121215] border border-gray-800 space-y-1">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                                        Tautan Link Tugas:
                                                    </span>
                                                    <a
                                                        href={safeExternalUrl(item.proof_link)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-xs text-unguterang font-medium underline decoration-unguterang/50 hover:text-white flex items-center justify-between gap-2 break-all"
                                                    >
                                                        <span className="truncate">{item.proof_link}</span>
                                                        <ExternalLink size={12} className="shrink-0 text-gray-400" />
                                                    </a>
                                                </div>
                                            )}

                                            {item.proof_notes && (
                                                <div className="bg-[#121215] p-2.5 rounded-lg border border-gray-800/80 text-xs">
                                                    <span className="text-[10px] font-bold text-gray-400 block mb-0.5">Catatan bukti kamu:</span>
                                                    <p className="text-gray-300 italic">{item.proof_notes}</p>
                                                </div>
                                            )}

                                            {isCompleted ? (
                                                <p className="text-[11px] text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-2.5 py-1.5 rounded-xl">
                                                    🎉 Pekerjaan Disetujui & Selesai • Pendapatan Rp {Number(item.bid_amount).toLocaleString("id-ID")} telah masuk ke Dompet!
                                                </p>
                                            ) : (
                                                <p className="text-[11px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-xl">
                                                    ⏳ Bukti sedang ditinjau oleh pemilik Gig.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* USER & HARGA */}
                        <div className="flex items-center justify-between mx-4 mt-4 pb-4 border-b border-gray-700">
                            <div className="flex items-center gap-2 text-sm">
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                    isInactive ? "bg-gray-800 text-gray-400" : "bg-ungu text-white"
                                }`}>
                                    <UserRound size={20} className={isInactive ? "text-gray-400" : "text-white"} />
                                </div>
                                <span className="text-white wrap-break-words text-xs">
                                    Oleh {item.gig?.user?.fullName || "Klien"}
                                </span>
                            </div>
                            <div className="ml-auto shrink-0 text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Tawaran Kamu
                                </p>
                                <p className="mt-0.5 text-xl font-black text-unguterang">
                                    {Number(item.bid_amount).toLocaleString("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                        maximumFractionDigits: 0,
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* FOOTER: BUDGET ASLI & AKSI */}
                        <div className="flex items-center justify-between py-4 mx-4 text-xs font-semibold text-gray-400">
                            <span className="text-[11px] text-gray-400">
                                Budget: Rp {Number(item.gig?.budget || 0).toLocaleString("id-ID")}
                            </span>

                            {isAccepted ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const convId = item.conversation?.id || item.conversation_id;
                                        if (convId) {
                                            navigate(`/chats/room/${convId}`);
                                        } else {
                                            navigate("/chats");
                                        }
                                    }}
                                    className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-ungu/20 border border-ungu/40 text-unguterang active:scale-95 transition-transform flex items-center gap-1.5 hover:bg-ungu/30"
                                >
                                    <MessageSquare size={13} />
                                    <span>Chat {item.gig?.user?.fullName ? item.gig.user.fullName.split(" ")[0] : "Klien"}</span>
                                </button>
                            ) : isPending ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedEdit(item);
                                        }}
                                        className="px-3 py-1.5 rounded-full text-xs font-bold bg-unguterang/15 border border-unguterang text-unguterang active:scale-95 transition-transform flex items-center gap-1.5"
                                    >
                                        <Edit3 size={13} />
                                        <span>Ubah</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === item.id}
                                        onClick={(e) => handleWithdraw(e, item.id)}
                                        className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#2a2a2a] text-gray-400 border border-gray-700 active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        <Undo2 size={13} />
                                        <span>Tarik</span>
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </article>
                );
            })}

            {/* LIGHTBOX PREVIEW BUKTI */}
            {previewPhotoUrl && (
                <ProofLightbox
                    photoUrl={previewPhotoUrl}
                    onClose={() => setPreviewPhotoUrl(null)}
                />
            )}

            {/* MODAL UBAH PENAWARAN */}
            {selectedEdit && (
                <EditProposalModal
                    proposal={selectedEdit}
                    onClose={() => setSelectedEdit(null)}
                    onRefresh={() => setRefreshKey((k) => k + 1)}
                />
            )}

            {/* MODAL SUBMIT BUKTI PEKERJAAN */}
            {selectedSubmitProof && (
                <SubmitProofModal
                    item={selectedSubmitProof}
                    onClose={() => setSelectedSubmitProof(null)}
                    onRefresh={() => setRefreshKey((k) => k + 1)}
                />
            )}
        </div>
    );
}
