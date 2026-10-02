import { useState, useEffect } from "react";
import { Users, Edit3, Trash2, Clock, Coffee, AlertTriangle, UserRound, ArrowUpRight, PowerOff, CheckCircle2, CreditCard } from "lucide-react";
import { useNavigate } from "react-router";
import { getCategoryIcon } from "../../lib/categories";
import { getCsrfToken } from "../../lib/api";
import PelamarModal from "./PelamarModal";
import EditGigModal from "./EditGigModal";

const urgencyStyles = {
    santai: { icon: Coffee, color: "text-green-400" },
    segera: { icon: Clock, color: "text-yellow-400" },
    mendesak: { icon: AlertTriangle, color: "text-red-400" },
};

function UrgencyBadge({ urgency }) {
    const config = urgencyStyles[urgency?.trim().toLowerCase()] || urgencyStyles.santai;
    const Icon = config.icon;

    return (
        <span className="inline-flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a]">
                <Icon size={14} strokeWidth={2} className={config.color} />
            </span>
            <span className="flex flex-col gap-0.5">
                <span className="text-[8px] text-gray-400">Tingkat Urgensi</span>
                <span className="capitalize text-white text-[11px] font-bold">{urgency || "Santai"}</span>
            </span>
        </span>
    );
}

export default function GigKamuTab({ category = "Semua", sortOrder = "desc" }) {
    const navigate = useNavigate();
    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGigPelamar, setSelectedGigPelamar] = useState(null);
    const [selectedGigEdit, setSelectedGigEdit] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // FETCH GIG SAYA
    useEffect(() => {
        let ignore = false;
        async function fetchMyGigs() {
            try {
                const res = await fetch("/api/my-gigs", {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });
                const data = await res.json();
                if (!ignore && res.ok) {
                    setGigs(data.gigs || []);
                }
            } catch {
                // SILENT ERROR
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        fetchMyGigs();
        return () => {
            ignore = true;
        };
    }, [refreshKey]);

    // HAPUS GIG
    const handleDelete = async (id, e) => {
        e?.stopPropagation();
        if (!window.confirm("Apakah kamu yakin ingin membatalkan dan menghapus Gig ini?")) return;

        setActionLoadingId(id);
        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch(`/api/gigs/${id}`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
            });
            const data = await res.json();
            if (res.ok) {
                setGigs((prev) => prev.filter((g) => g.id !== id));
            } else {
                alert(data.message || "Gagal menghapus gig.");
            }
        } catch {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setActionLoadingId(null);
        }
    };

    // TOGGLE STATUS GIG (TUTUP / BUKA GIG)
    const handleToggleStatus = async (id, e) => {
        e?.stopPropagation();
        setActionLoadingId(id);
        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch(`/api/gigs/${id}/toggle-status`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
            });
            const data = await res.json();
            if (res.ok) {
                setGigs((prev) =>
                    prev.map((g) => (g.id === id ? { ...g, status: data.status } : g))
                );
            } else {
                alert(data.message || "Gagal mengubah status gig.");
            }
        } catch {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setActionLoadingId(null);
        }
    };

    // FILTER KATEGORI & SORTING TANGGAL
    const filteredGigs = gigs
        .filter((gig) => category === "Semua" || (gig.category || "").toLowerCase() === category.toLowerCase())
        .sort((a, b) => {
            const timeA = new Date(a.created_at || 0).getTime();
            const timeB = new Date(b.created_at || 0).getTime();
            return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
        });

    if (loading) {
        return <p className="text-center text-sm text-gray-400 py-12">Memuat Gig kamu...</p>;
    }

    if (gigs.length === 0) {
        return (
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-gray-800 bg-[#161618]">
                <p className="font-bold text-gray-300">Belum ada Gig yang kamu buat</p>
                <p className="text-xs text-gray-500 mt-1">Post pekerjaan baru lewat tombol Buat Gig di dashboard.</p>
            </div>
        );
    }

    if (filteredGigs.length === 0) {
        return (
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-gray-800 bg-[#161618]">
                <p className="font-bold text-gray-300">Tidak ada Gig untuk kategori &quot;{category}&quot;</p>
                <p className="text-xs text-gray-500 mt-1">Coba pilih kategori lain atau pilih &quot;Semua&quot;.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* DAFTAR CARD GIG SAYA */}
            {filteredGigs.map((gig) => {
                const isOpen = gig.status === "open";
                const isClosed = gig.status === "closed";
                const isAwaitingPayment = gig.status === "awaiting_payment";
                const isProgress = gig.status === "in_progress";
                const isCompleted = gig.status === "completed";
                const proposalsCount = gig.proposals_count || 0;
                const acceptedCount = gig.accepted_count || 0;
                const isBarengan = gig.mode === "barengan";

                // HITUNG PERSENTASE PROGRES
                let progressPercent = 25;
                let progressLabel = "Membuka Lowongan (25%)";
                let progressColor = "bg-unguterang";

                if (isCompleted) {
                    progressPercent = 100;
                    progressLabel = "Selesai (100%)";
                    progressColor = "bg-green-400";
                } else if (isClosed) {
                    progressPercent = 100;
                    progressLabel = "Gig Ditutup (100%)";
                    progressColor = "bg-gray-500";
                } else if (isAwaitingPayment) {
                    progressPercent = 40;
                    progressLabel = "Menunggu Pembayaran Escrow (40%)";
                    progressColor = "bg-amber-400";
                } else if (isProgress) {
                    progressPercent = 65;
                    progressLabel = `Sedang Dikerjakan (${acceptedCount > 0 ? `${acceptedCount} Pekerja` : "65%"})`;
                    progressColor = "bg-blue-400";
                }

                const isInactive = isClosed || isCompleted;

                return (
                    <article
                        key={gig.id}
                        onClick={() => navigate(`/gig/${gig.id}`)}
                        className={`h-fit w-auto rounded-3xl border cursor-pointer active:scale-[0.99] transition-all ${
                            isInactive
                                ? "bg-[#141417]/95 border-gray-800/90 shadow-none hover:border-gray-700"
                                : isAwaitingPayment
                                ? "bg-amber-500/5 border-amber-500/50 shadow-[0_0_16px_0] shadow-amber-500/10"
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
                                        src={getCategoryIcon(gig.category)}
                                        alt=""
                                        className={`absolute left-1/2 top-1/2 h-9 w-9 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain ${
                                            isInactive ? "opacity-70 grayscale-[30%]" : ""
                                        }`}
                                    />
                                </span>
                                {gig.category || "Random"}
                            </span>

                            <div className="flex items-center gap-2">
                                {/* BADGE MODE */}
                                <span
                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                        isInactive
                                            ? "bg-gray-800/60 text-gray-400 border-gray-800"
                                            : "bg-white/10 text-gray-300 border-white/10"
                                    }`}
                                >
                                    {isBarengan ? `👥 Barengan (${acceptedCount}/${gig.max_workers || 3})` : "👤 1 Orang"}
                                </span>

                                {/* BADGE STATUS */}
                                <span className={`uppercase tracking-wider text-[10px] font-black rounded-full px-2.5 py-1 border ${
                                    isCompleted
                                        ? "bg-green-500/15 border-green-500/60 text-green-400"
                                        : isClosed
                                        ? "bg-gray-800 border-gray-700 text-gray-400"
                                        : isAwaitingPayment
                                        ? "bg-amber-500/15 border-amber-500/60 text-amber-400"
                                        : isProgress
                                        ? "bg-blue-500/15 border-blue-500/60 text-blue-400"
                                        : "bg-unguterang/15 border-unguterang text-unguterang"
                                }`}>
                                    {isAwaitingPayment ? "Menunggu Pembayaran" : gig.status.replaceAll("_", " ")}
                                </span>
                            </div>
                        </div>

                        {/* JUDUL & DESKRIPSI */}
                        <div className="flex flex-col gap-1 mx-4 text-white">
                            <div className="mt-2">
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className={`wrap-break-words text-lg font-extrabold leading-snug ${
                                        isInactive ? "text-gray-300" : "text-white"
                                    }`}>
                                        {gig.title}
                                    </h2>
                                    <ArrowUpRight size={18} className="text-gray-500 shrink-0" />
                                </div>

                                {gig.description && (
                                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-400">
                                        {gig.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* INDIKATOR PROGRES & STATUS PEKERJA */}
                        <div className={`mx-4 mt-4 p-3 rounded-2xl border space-y-2 ${
                            isInactive
                                ? "bg-[#101012] border-gray-800/80"
                                : "bg-[#17171a] border-gray-800"
                        }`}>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400 font-bold flex items-center gap-1.5">
                                    <CheckCircle2 size={13} className={isInactive ? "text-gray-500" : "text-unguterang"} /> Progres Pengerjaan
                                </span>
                                <span className={`font-bold ${isInactive ? "text-gray-400" : "text-gray-200"}`}>{progressLabel}</span>
                            </div>

                            {/* PROGRESS BAR */}
                            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>

                            {/* INFO PEKERJA BERDASARKAN MODE */}
                            <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                                <span>
                                    Mode: <strong className="text-gray-300">{isBarengan ? "Banyakan (Barengan)" : "1 Orang (Sendiri)"}</strong>
                                </span>
                                <span>
                                    Pekerja di-ACC: <strong className={isInactive ? "text-gray-300" : "text-unguterang"}>{acceptedCount} Pekerja</strong>
                                </span>
                            </div>
                        </div>

                        {/* USER & HARGA */}
                        <div className="flex items-center justify-between mx-4 mt-4 pb-4 border-b border-gray-800">
                            <div className="flex items-center gap-2 text-sm">
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                    isInactive ? "bg-gray-800 text-gray-400" : "bg-ungu text-white"
                                }`}>
                                    <UserRound size={20} className={isInactive ? "text-gray-400" : "text-white"} />
                                </div>
                                <span className="text-gray-300 wrap-break-words text-xs">
                                    Kamu (Pemilik)
                                </span>
                            </div>
                            <div className="ml-auto shrink-0 text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Budget Juragan
                                </p>
                                <p className={`mt-0.5 text-xl font-black ${
                                    isInactive ? "text-gray-300" : "text-unguterang"
                                }`}>
                                    {Number(gig.budget).toLocaleString("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                        maximumFractionDigits: 0,
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* FOOTER: URGENSI & AKSI */}
                        <div className="flex flex-wrap items-center justify-between gap-2 py-4 mx-4 text-xs font-semibold text-gray-400">
                            <div className="flex items-center gap-2">
                                <UrgencyBadge urgency={gig.urgency} />
                            </div>

                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                {/* TOMBOL LIHAT PELAMAR */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedGigPelamar(gig.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-transform flex items-center gap-1.5 border ${
                                        isInactive
                                            ? "bg-gray-800/80 border-gray-700 text-gray-300"
                                            : "bg-unguterang/15 border-unguterang text-unguterang"
                                    }`}
                                >
                                    <Users size={13} />
                                    <span>{proposalsCount} Pelamar</span>
                                </button>

                                {/* TOMBOL BAYAR ESCROW JIKA MENUNGGU PEMBAYARAN */}
                                {isAwaitingPayment && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate("/payments");
                                        }}
                                        className="px-3 py-1.5 rounded-full text-xs font-black bg-amber-500 text-black active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 animate-pulse hover:animate-none hover:bg-amber-400"
                                        title="Bayar tagihan escrow ke freelancer"
                                    >
                                        <CreditCard size={13} />
                                        <span>Bayar Escrow</span>
                                    </button>
                                )}

                                {/* TOMBOL TUTUP / BUKA GIG */}
                                {!isCompleted && (
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === gig.id}
                                        onClick={(e) => handleToggleStatus(gig.id, e)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border active:scale-95 transition-all flex items-center gap-1.5 ${
                                            isClosed
                                                ? "bg-green-500/15 border-green-500/50 text-green-400"
                                                : "bg-gray-800 border-gray-700 text-gray-300 hover:text-white"
                                        }`}
                                        title={isClosed ? "Buka kembali lowongan Gig" : "Tutup Gig (tidak tampil di dashboard)"}
                                    >
                                        <PowerOff size={12} />
                                        <span>{isClosed ? "Buka" : "Tutup"}</span>
                                    </button>
                                )}

                                {/* TOMBOL EDIT & HAPUS JIKA MASIH OPEN */}
                                {isOpen && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedGigEdit(gig)}
                                            className="p-2 rounded-xl bg-[#2a2a2a] text-gray-300 active:scale-95 transition-all"
                                            title="Edit Gig"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={actionLoadingId === gig.id}
                                            onClick={(e) => handleDelete(gig.id, e)}
                                            className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 active:scale-95 transition-all disabled:opacity-50"
                                            title="Batalkan & Hapus Gig"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </article>
                );
            })}

            {/* MODAL PELAMAR */}
            {selectedGigPelamar && (
                <PelamarModal
                    gigId={selectedGigPelamar}
                    onClose={() => setSelectedGigPelamar(null)}
                    onRefresh={() => setRefreshKey((k) => k + 1)}
                />
            )}

            {/* MODAL EDIT GIG */}
            {selectedGigEdit && (
                <EditGigModal
                    gig={selectedGigEdit}
                    onClose={() => setSelectedGigEdit(null)}
                    onRefresh={() => setRefreshKey((k) => k + 1)}
                />
            )}
        </div>
    );
}
