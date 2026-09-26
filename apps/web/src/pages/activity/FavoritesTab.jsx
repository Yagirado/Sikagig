import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Heart, UserRound, ArrowUpRight, Coffee, Clock, AlertTriangle } from "lucide-react";
import { getCategoryIcon } from "../../lib/categories";

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

export default function FavoritesTab() {
    const navigate = useNavigate();
    const [gigs, setGigs] = useState([]);
    const [jasas, setJasas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("semua"); // 'semua' | 'gig' | 'jasa'
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // FETCH SEMUA FAVORIT SAYA
    useEffect(() => {
        let ignore = false;
        async function fetchFavorites() {
            try {
                const res = await fetch("/api/favorites", {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });
                const data = await res.json();
                if (!ignore && res.ok) {
                    setGigs(data.gigs || []);
                    setJasas(data.jasas || []);
                }
            } catch {
                // SILENT ERROR
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        fetchFavorites();
        return () => {
            ignore = true;
        };
    }, []);

    // HAPUS DARI FAVORIT LANGSUNG DARI LIST
    const handleUnfavorite = async (e, type, targetId) => {
        e.stopPropagation();
        setActionLoadingId(`${type}-${targetId}`);
        try {
            const res = await fetch("/api/favorites/toggle", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ type, target_id: targetId }),
            });
            if (res.ok) {
                if (type === "gig") {
                    setGigs((prev) => prev.filter((g) => g.id !== targetId));
                } else {
                    setJasas((prev) => prev.filter((j) => j.id !== targetId));
                }
            }
        } catch {
            // SILENT ERROR
        } finally {
            setActionLoadingId(null);
        }
    };

    if (loading) {
        return <p className="text-center text-sm text-gray-400 py-12">Memuat favorit kamu...</p>;
    }

    const showGigs = activeFilter === "semua" || activeFilter === "gig";
    const showJasas = activeFilter === "semua" || activeFilter === "jasa";
    const totalCount = gigs.length + jasas.length;

    if (totalCount === 0) {
        return (
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-gray-800 bg-[#161618]">
                <p className="font-bold text-gray-300">Belum ada favorit yang kamu simpan</p>
                <p className="text-xs text-gray-500 mt-1">Tekan ikon love pada Gig atau Jasa untuk menyimpannya di sini.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* FILTER PILIHAN TIPE FAVORIT */}
            <div className="flex gap-2">
                {[
                    { id: "semua", label: `Semua (${totalCount})` },
                    { id: "gig", label: `Gig (${gigs.length})` },
                    { id: "jasa", label: `Jasa (${jasas.length})` },
                ].map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        onClick={() => setActiveFilter(f.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                            activeFilter === f.id
                                ? "bg-ungu text-white shadow-[0_2px_8px_rgba(149,100,221,0.4)]"
                                : "bg-[#1e1e24] text-gray-400 border border-gray-800"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* DAFTAR CARD GIG FAVORIT */}
            {showGigs &&
                gigs.map((gig) => (
                    <article
                        key={`gig-${gig.id}`}
                        onClick={() => navigate(`/gig/${gig.id}`)}
                        className="h-fit w-auto bg-dark rounded-3xl border border-unguterang shadow-[0_0_16px_0] shadow-unguterang/20 cursor-pointer active:scale-[0.99] transition-all"
                    >
                        {/* KATEGORI & TOMBOL UNFAVORITE */}
                        <div className="flex items-center justify-between my-4 mx-4">
                            <span className="inline-flex items-center gap-4 rounded-full bg-light/50 px-3 py-2 text-xs font-black tracking-wider text-white">
                                <span className="relative h-3 w-3 shrink-0 ml-1.5">
                                    <img
                                        src={getCategoryIcon(gig.category)}
                                        alt=""
                                        className="absolute left-1/2 top-1/2 h-9 w-9 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
                                    />
                                </span>
                                {gig.category || "Gig"}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="bg-unguterang/15 border border-unguterang uppercase tracking-wider text-unguterang text-[10px] font-black rounded-full px-2.5 py-1">
                                    GIG
                                </span>
                                <button
                                    type="button"
                                    disabled={actionLoadingId === `gig-${gig.id}`}
                                    onClick={(e) => handleUnfavorite(e, "gig", gig.id)}
                                    className="p-1.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 active:scale-90 transition-transform"
                                    title="Hapus dari Favorit"
                                >
                                    <Heart size={15} className="fill-rose-500" />
                                </button>
                            </div>
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
                                    {gig.user?.fullName || "Pengguna"}
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

                        {/* FOOTER: URGENSI & LINK */}
                        <div className="flex items-center justify-between py-4 mx-4 text-xs font-semibold text-gray-400">
                            <UrgencyBadge urgency={gig.urgency} />
                            <div className="flex items-center gap-1 text-unguterang font-bold text-xs">
                                <span>Lihat Detail</span>
                                <ArrowUpRight size={15} />
                            </div>
                        </div>
                    </article>
                ))}

            {/* DAFTAR CARD JASA FAVORIT */}
            {showJasas &&
                jasas.map((jasa) => (
                    <article
                        key={`jasa-${jasa.id}`}
                        onClick={() => navigate(`/jasa/${jasa.id}`)}
                        className="h-fit w-auto bg-dark rounded-3xl border border-unguterang shadow-[0_0_16px_0] shadow-unguterang/20 cursor-pointer active:scale-[0.99] transition-all"
                    >
                        {/* KATEGORI & TOMBOL UNFAVORITE */}
                        <div className="flex items-center justify-between my-4 mx-4">
                            <span className="inline-flex items-center gap-4 rounded-full bg-light/50 px-3 py-2 text-xs font-black tracking-wider text-white">
                                <span className="relative h-3 w-3 shrink-0 ml-1.5">
                                    <img
                                        src={getCategoryIcon(jasa.category)}
                                        alt=""
                                        className="absolute left-1/2 top-1/2 h-9 w-9 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
                                    />
                                </span>
                                {jasa.category || "Jasa"}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="bg-blue-500/15 border border-blue-500 uppercase tracking-wider text-blue-400 text-[10px] font-black rounded-full px-2.5 py-1">
                                    JASA
                                </span>
                                <button
                                    type="button"
                                    disabled={actionLoadingId === `jasa-${jasa.id}`}
                                    onClick={(e) => handleUnfavorite(e, "jasa", jasa.id)}
                                    className="p-1.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 active:scale-90 transition-transform"
                                    title="Hapus dari Favorit"
                                >
                                    <Heart size={15} className="fill-rose-500" />
                                </button>
                            </div>
                        </div>

                        {/* JUDUL & DESKRIPSI */}
                        <div className="flex flex-col gap-1 mx-4 text-white">
                            <div className="mt-2">
                                <h2 className="wrap-break-words text-lg font-extrabold leading-snug">
                                    {jasa.name}
                                </h2>
                                {jasa.description && (
                                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-300">
                                        {jasa.description}
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
                                    {jasa.user?.fullName || "Penyedia Jasa"}
                                </span>
                            </div>
                            <div className="ml-auto shrink-0 text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Mulai Dari
                                </p>
                                <p className="mt-0.5 text-xl font-black text-unguterang">
                                    {Number(jasa.price).toLocaleString("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                        maximumFractionDigits: 0,
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* FOOTER: PAKET & LINK */}
                        <div className="flex items-center justify-between py-4 mx-4 text-xs font-semibold text-gray-400">
                            <span className="text-[11px] text-gray-400">
                                {jasa.packages?.length || 1} Pilihan Paket
                            </span>
                            <div className="flex items-center gap-1 text-unguterang font-bold text-xs">
                                <span>Lihat Detail</span>
                                <ArrowUpRight size={15} />
                            </div>
                        </div>
                    </article>
                ))}
        </div>
    );
}
