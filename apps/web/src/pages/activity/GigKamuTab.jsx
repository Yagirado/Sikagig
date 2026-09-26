import { useState, useEffect } from "react";
import { Users, Edit3, Trash2, Clock, Coffee, AlertTriangle, UserRound } from "lucide-react";
import { getCategoryIcon } from "../../lib/categories";
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

export default function GigKamuTab() {
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
    const handleDelete = async (id) => {
        if (!window.confirm("Apakah kamu yakin ingin membatalkan dan menghapus Gig ini?")) return;

        setActionLoadingId(id);
        try {
            const res = await fetch(`/api/gigs/${id}`, {
                method: "DELETE",
                credentials: "include",
                headers: { Accept: "application/json" },
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

    return (
        <div className="flex flex-col gap-4">
            {/* DAFTAR CARD GIG SAYA */}
            {gigs.map((gig) => {
                const isOpen = gig.status === "open";
                const proposalsCount = gig.proposals_count || 0;

                return (
                    <article
                        key={gig.id}
                        className="h-fit w-auto bg-dark rounded-3xl border border-unguterang shadow-[0_0_16px_0] shadow-unguterang/20"
                    >
                        {/* KATEGORI & STATUS BADGE */}
                        <div className="flex items-center justify-between my-4 mx-4">
                            <span className="inline-flex items-center gap-4 rounded-full bg-light/50 px-3 py-2 text-xs font-black tracking-wider text-white">
                                <span className="relative h-3 w-3 shrink-0 ml-1.5">
                                    <img
                                        src={getCategoryIcon(gig.category)}
                                        alt=""
                                        className="absolute left-1/2 top-1/2 h-9 w-9 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
                                    />
                                </span>
                                {gig.category || "Random"}
                            </span>
                            <span className="bg-unguterang/15 border border-unguterang uppercase tracking-wider text-unguterang text-[10px] font-black rounded-full px-2.5 py-1">
                                {gig.status.replaceAll("_", " ")}
                            </span>
                        </div>

                        {/* JUDUL & DESKRIPSI */}
                        <div className="flex flex-col gap-1 mx-4 text-white">
                            <div className="mt-2">
                                <h2 className="wrap-break-words text-lg font-extrabold leading-snug">
                                    {gig.title}
                                </h2>

                                {gig.description && (
                                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-300">
                                        {gig.description}
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
                                    Kamu (Pemilik)
                                </span>
                            </div>
                            <div className="ml-auto shrink-0 text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Per Gig
                                </p>
                                <p className="mt-0.5 text-xl font-black text-unguterang">
                                    {Number(gig.budget).toLocaleString("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                        maximumFractionDigits: 0,
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* FOOTER: URGENSI & AKSI */}
                        <div className="flex items-center justify-between py-4 mx-4 text-xs font-semibold text-gray-400">
                            <div className="flex items-center gap-2">
                                <UrgencyBadge urgency={gig.urgency} />
                            </div>

                            <div className="flex items-center gap-2">
                                {/* TOMBOL LIHAT PELAMAR */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedGigPelamar(gig.id)}
                                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-unguterang/15 border border-unguterang text-unguterang active:scale-95 transition-transform flex items-center gap-1.5"
                                >
                                    <Users size={13} />
                                    <span>{proposalsCount} Pelamar</span>
                                </button>

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
                                            onClick={() => handleDelete(gig.id)}
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
