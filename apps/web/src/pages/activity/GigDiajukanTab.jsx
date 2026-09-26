import { useState, useEffect } from "react";
import { Edit3, Undo2, UserRound } from "lucide-react";
import { getCategoryIcon } from "../../lib/categories";
import EditProposalModal from "./EditProposalModal";

export default function GigDiajukanTab() {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEdit, setSelectedEdit] = useState(null);
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
    const handleWithdraw = async (id) => {
        if (!window.confirm("Yakin ingin menarik kembali lamaran ini?")) return;

        setActionLoadingId(id);
        try {
            const res = await fetch(`/api/proposals/${id}/withdraw`, {
                method: "DELETE",
                credentials: "include",
                headers: { Accept: "application/json" },
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

    return (
        <div className="flex flex-col gap-4">
            {/* DAFTAR CARD LAMARAN GIG */}
            {proposals.map((item) => {
                const isPending = item.status === "pending";
                const isAccepted = item.status === "accepted";
                const isWithdrawn = item.status === "withdrawn";

                const statusColor = isPending
                    ? "bg-yellow-500/15 border-yellow-500/60 text-yellow-400"
                    : isAccepted
                    ? "bg-green-500/15 border-green-500/60 text-green-400"
                    : isWithdrawn
                    ? "bg-gray-500/15 border-gray-500/60 text-gray-400"
                    : "bg-red-500/15 border-red-500/60 text-red-400";

                const statusLabel = isPending
                    ? "Menunggu Respon"
                    : isAccepted
                    ? "Diterima"
                    : isWithdrawn
                    ? "Ditarik"
                    : "Ditolak";

                return (
                    <article
                        key={item.id}
                        className="h-fit w-auto bg-dark rounded-3xl border border-unguterang shadow-[0_0_16px_0] shadow-unguterang/20"
                    >
                        {/* KATEGORI & STATUS BADGE */}
                        <div className="flex items-center justify-between my-4 mx-4">
                            <span className="inline-flex items-center gap-4 rounded-full bg-light/50 px-3 py-2 text-xs font-black tracking-wider text-white">
                                <span className="relative h-3 w-3 shrink-0 ml-1.5">
                                    <img
                                        src={getCategoryIcon(item.gig?.category)}
                                        alt=""
                                        className="absolute left-1/2 top-1/2 h-9 w-9 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
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
                                <h2 className="wrap-break-words text-lg font-extrabold leading-snug">
                                    {item.gig?.title || "Gig"}
                                </h2>

                                {item.cover_letter && (
                                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-300 italic">
                                        "{item.cover_letter}"
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* USER & HARGA */}
                        <div className="flex items-center justify-between mx-4 mt-4 pb-4 border-b border-gray-700">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ungu">
                                    <UserRound size={20} className="text-white" />
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

                            {isPending && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedEdit(item)}
                                        className="px-3 py-1.5 rounded-full text-xs font-bold bg-unguterang/15 border border-unguterang text-unguterang active:scale-95 transition-transform flex items-center gap-1.5"
                                    >
                                        <Edit3 size={13} />
                                        <span>Ubah</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === item.id}
                                        onClick={() => handleWithdraw(item.id)}
                                        className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#2a2a2a] text-gray-400 border border-gray-700 active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        <Undo2 size={13} />
                                        <span>Tarik</span>
                                    </button>
                                </div>
                            )}
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
        </div>
    );
}
