import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Edit3, Undo2, UserRound, Calendar, TrendingUp } from "lucide-react";
import { getCategoryIcon } from "../../lib/categories";
import { getCsrfToken } from "../../lib/api";
import EditProposalModal from "./EditProposalModal";
import UpdateProgressModal from "./UpdateProgressModal";

export default function GigDiajukanTab({ category = "Semua", sortOrder = "desc" }) {
    const navigate = useNavigate();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEdit, setSelectedEdit] = useState(null);
    const [selectedProgressEdit, setSelectedProgressEdit] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

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
                const isAccepted = item.status === "accepted";
                const isRejected = item.status === "rejected";
                const isWithdrawn = item.status === "withdrawn";
                const isPending = item.status === "pending" && !gigClosed;

                const statusColor = isAccepted
                    ? "bg-green-500/15 border-green-500/60 text-green-400"
                    : isPending
                    ? "bg-yellow-500/15 border-yellow-500/60 text-yellow-400"
                    : isWithdrawn
                    ? "bg-gray-500/15 border-gray-500/60 text-gray-400"
                    : "bg-red-500/15 border-red-500/60 text-red-400";

                const statusLabel = isAccepted
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

                const workerProgress = item.progress ?? 0;

                const isCompleted = isAccepted && workerProgress === 100;
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

                            {/* TANGGAL PENGAJUAN */}
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-2">
                                <Calendar size={12} className="text-gray-500" />
                                <span>Diajukan: {formattedDate}</span>
                            </div>
                        </div>

                        {/* PROGRES KERJA JIKA SUDAH DITERIMA */}
                        {isAccepted && (
                            <div className="mx-4 mt-3 pt-3 border-t border-gray-800 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-gray-300 font-bold flex items-center gap-1">
                                        <TrendingUp size={12} className="text-green-400" />
                                        Progres Kerja Kamu
                                    </span>
                                    <span className="font-black text-unguterang">{workerProgress}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${
                                            isCompleted
                                                ? "bg-green-500"
                                                : "bg-gradient-to-r from-ungu to-green-400"
                                        }`}
                                        style={{ width: `${workerProgress}%` }}
                                    />
                                </div>

                                {isCompleted && (
                                    <p className="text-[11px] text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-2.5 py-1.5 rounded-xl">
                                        🎉 Pekerjaan Selesai • Pendapatan +Rp {Number(item.bid_amount).toLocaleString("id-ID")} masuk ke Dompet!
                                    </p>
                                )}

                                {item.progress_notes && !isCompleted && (
                                    <p className="text-[11px] text-gray-400 italic line-clamp-1">
                                        Catatan: {item.progress_notes}
                                    </p>
                                )}
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
                                        setSelectedProgressEdit(item);
                                    }}
                                    className="px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-ungu to-unguterang text-white active:scale-95 transition-transform flex items-center gap-1.5 shadow-md shadow-ungu/20"
                                >
                                    <TrendingUp size={13} />
                                    <span>{isCompleted ? "Lihat / Edit Progres" : "Update Progres"}</span>
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

            {/* MODAL UBAH PENAWARAN */}
            {selectedEdit && (
                <EditProposalModal
                    proposal={selectedEdit}
                    onClose={() => setSelectedEdit(null)}
                    onRefresh={() => setRefreshKey((k) => k + 1)}
                />
            )}

            {/* MODAL UPDATE PROGRES KERJA */}
            {selectedProgressEdit && (
                <UpdateProgressModal
                    proposal={selectedProgressEdit}
                    onClose={() => setSelectedProgressEdit(null)}
                    onRefresh={() => setRefreshKey((k) => k + 1)}
                />
            )}
        </div>
    );
}


