import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Clock, Flame, Coffee, User, Maximize2, Users, X, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { getCategoryIcon } from "../../../lib/categories";

/* BASE URL STORAGE: DEV PAKAI PORT LARAVEL, PROD PAKAI SAME ORIGIN */
const STORAGE = import.meta.env.DEV ? "http://localhost:8000/storage" : "/storage";

/* HELPER: PARSE PHOTOS FIELD (BISA ARRAY, JSON STRING, ATAU STRING BIASA) */
function parsePhotos(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [raw];
        } catch {
            return raw.includes(",")
                ? raw.split(",").map((s) => s.trim()).filter(Boolean)
                : [raw];
        }
    }
    return [];
}

/* LIGHTBOX COMPONENT */
function Lightbox({ photos, startIndex, onClose }) {
    const [current, setCurrent] = useState(startIndex);

    const prev = () => setCurrent((c) => (c - 1 + photos.length) % photos.length);
    const next = () => setCurrent((c) => (c + 1) % photos.length);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") setCurrent((c) => (c - 1 + photos.length) % photos.length);
            if (e.key === "ArrowRight") setCurrent((c) => (c + 1) % photos.length);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [photos.length, onClose]);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center z-10"
                onClick={onClose}
            >
                <X size={20} className="text-white" />
            </button>

            {/* Counter */}
            <p className="absolute top-5 left-1/2 -translate-x-1/2 text-xs text-gray-400 font-bold">
                {current + 1} / {photos.length}
            </p>

            {/* Image */}
            <div className="max-w-[90vw] max-h-[80vh] relative" onClick={(e) => e.stopPropagation()}>
                <img
                    src={`${STORAGE}/${photos[current]}`}
                    alt={`Lampiran ${current + 1}`}
                    className="max-w-full max-h-[80vh] object-contain rounded-2xl"
                />
            </div>

            {/* Nav buttons - hanya kalau lebih dari 1 */}
            {photos.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); prev(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                    >
                        <ChevronLeft size={20} className="text-white" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); next(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                    >
                        <ChevronRight size={20} className="text-white" />
                    </button>
                </>
            )}
        </div>
    );
}

export default function DetailGig() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [gig, setGig] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lightboxIdx, setLightboxIdx] = useState(null);

    /* FETCH DATA GIG */
    useEffect(() => {
        async function fetchGig() {
            try {
                const res = await fetch(`/api/gigs/${id}`, {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });
                if (!res.ok) throw new Error("Gig tidak ditemukan");
                const data = await res.json();
                setGig(data.gig);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchGig();
    }, [id]);

    /* SKELETON LOADER */
    if (isLoading) {
        return (
            <div className="mobile-container bg-[#121212] min-h-screen pb-24 text-white">
                <div className="flex items-center gap-4 px-6 py-4 -mx-6 -mt-6 border-b border-gray-800 animate-pulse">
                    <div className="w-8 h-8 bg-gray-800 rounded-full" />
                    <div className="h-6 w-32 bg-gray-800 rounded-lg" />
                </div>
                <div className="mt-8 space-y-4">
                    <div className="h-10 w-3/4 bg-gray-800 rounded-lg animate-pulse" />
                    <div className="h-8 w-1/2 bg-gray-800 rounded-lg animate-pulse mt-2" />
                </div>
                <div className="mt-8 glass-card p-4 rounded-3xl h-24 animate-pulse" />
                <div className="mt-6 glass-card p-4 rounded-3xl h-48 animate-pulse" />
            </div>
        );
    }

    /* ERROR STATE */
    if (error || !gig) {
        return (
            <div className="mobile-container bg-[#121212] min-h-screen pb-24 text-white flex flex-col items-center justify-center">
                <p className="text-xl font-bold mb-4">{error || "Terjadi kesalahan"}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 bg-ungu rounded-xl font-bold active:scale-95 transition-all"
                >
                    Kembali
                </button>
            </div>
        );
    }

    /* URGENCY CONFIG */
    const urgencyText = (gig.urgency || "Santai").toLowerCase();
    let UrgencyIcon = Coffee;
    let urgencyColor = "text-green-400";
    let urgencyBg = "bg-green-400/20";
    if (urgencyText === "segera") {
        UrgencyIcon = Clock;
        urgencyColor = "text-yellow-400";
        urgencyBg = "bg-yellow-400/20";
    } else if (urgencyText === "mendesak") {
        UrgencyIcon = Flame;
        urgencyColor = "text-red-400";
        urgencyBg = "bg-red-400/20";
    }

    /* PARSE FOTO */
    const photos = parsePhotos(gig.photos);

    /* STATUS BADGE */
    const statusMap = {
        open: { label: "Terbuka", color: "text-unguterang", dot: "bg-unguterang", bg: "bg-ungu/20 border-ungu/40" },
        in_progress: { label: "Berjalan", color: "text-yellow-400", dot: "bg-yellow-400", bg: "bg-yellow-400/20 border-yellow-400/30" },
        completed: { label: "Selesai", color: "text-blue-400", dot: "bg-blue-400", bg: "bg-blue-400/20 border-blue-400/30" },
        cancelled: { label: "Dibatalkan", color: "text-red-400", dot: "bg-red-400", bg: "bg-red-400/20 border-red-400/30" },
    };
    const statusInfo = statusMap[(gig.status || "open").toLowerCase()] ?? statusMap.open;

    return (
        <div className="mobile-container text-white bg-[#121212] min-h-screen pb-28 relative">

            {/* LIGHTBOX */}
            {lightboxIdx !== null && (
                <Lightbox photos={photos} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
            )}

            {/* HEADER STICKY */}
            <div className="flex items-center gap-4 px-6 py-4 -mx-6 -mt-6 sticky top-0 bg-[#121212]/90 backdrop-blur-md z-20 border-b border-gray-800">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="p-2 active:bg-gray-800 active:scale-95 transition-all rounded-full"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold line-clamp-1">Detail Gig</h1>
            </div>

            {/* HERO SECTION */}
            <div className="mt-6 mb-8">
                {/* Badge kategori + status open */}
                <div className="flex items-center gap-2 flex-wrap mb-4">
                    <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#1e1e1e] border border-gray-700/80 shadow-sm">
                        <span className="relative h-4 w-4 shrink-0 flex items-center justify-center">
                            <img
                                src={getCategoryIcon(gig.category)}
                                alt=""
                                className="h-6 w-6 max-w-none object-contain"
                            />
                        </span>
                        <span className="text-xs font-bold text-gray-200">{gig.category || "Gig"}</span>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${statusInfo.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                        <span className={`text-xs font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                </div>

                <h2 className="text-3xl font-black leading-tight mb-4 tracking-tight">
                    {gig.title}
                </h2>
                <div className="flex items-end gap-1">
                    <h3 className="text-4xl font-black text-white">
                        Rp {Number(gig.budget).toLocaleString("id-ID")}
                    </h3>
                    <span className="text-gray-400 mb-1">/ budget</span>
                </div>

                {/* TARGET TANGGAL & MODE GIG (DI SEBELAH KANAN TANGGAL) */}
                <div className="flex items-center gap-2 flex-wrap mt-3.5">
                    {gig.deadline && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700">
                            <CalendarDays size={13} className="text-gray-400" />
                            <span className="text-xs text-gray-300 font-medium">
                                Target: {new Date(gig.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                            </span>
                        </div>
                    )}
                    {gig.mode && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700">
                            {gig.mode === "barengan"
                                ? <Users size={12} className="text-unguterang" />
                                : <User size={12} className="text-unguterang" />
                            }
                            <span className="text-xs font-bold text-gray-300 capitalize">
                                {gig.mode === "barengan" ? "Banyak Jagoan" : "Satu Jagoan"}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* INFORMASI POSTER */}
            <div className="glass-card rounded-3xl p-5 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-ungu to-unguterang flex items-center justify-center p-0.5">
                        <div className="w-full h-full bg-dark rounded-full flex items-center justify-center text-xl font-bold">
                            {gig.user?.fullName ? gig.user.fullName.charAt(0) : "A"}
                        </div>
                    </div>
                    <div>
                        <p className="font-bold text-lg leading-tight">{gig.user?.fullName || "Anonim"}</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <User size={12} /> Poster Gig
                        </p>
                    </div>
                </div>
                <button className="px-4 py-2 bg-gray-800 rounded-xl text-xs font-bold active:scale-95 active:bg-gray-700 transition-all border border-gray-700">
                    Lihat Profil
                </button>
            </div>

            {/* DESKRIPSI & STATUS URGENSI */}
            <div className="glass-card rounded-3xl p-6 mb-6 space-y-5">
                <div>
                    <h4 className="text-sm font-bold text-gray-400 mb-2">Deskripsi Pekerjaan</h4>
                    <p className="text-sm leading-relaxed text-gray-200">
                        {gig.description || "Tidak ada deskripsi yang diberikan."}
                    </p>
                </div>

                {/* STATUS URGENSI (BADGE SAJA, TANPA LABEL TEKS) */}
                <div className="pt-4 border-t border-gray-800/50">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-700 bg-[#1a1a1a]`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${urgencyBg}`}>
                            <UrgencyIcon size={12} className={urgencyColor} />
                        </div>
                        <span className="font-bold text-xs capitalize">{gig.urgency || "Santai"}</span>
                    </div>
                </div>
            </div>

            {/* LAMPIRAN */}
            {photos.length > 0 && (
                <div className="mb-6">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">Lampiran</p>
                    <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar">
                        {photos.map((photo, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setLightboxIdx(idx)}
                                className="relative shrink-0 w-[110px] h-[110px] rounded-2xl overflow-hidden border border-gray-800 bg-[#1a1a1a] active:scale-95 transition-transform"
                            >
                                <img
                                    src={`${STORAGE}/${photo}`}
                                    alt={`Lampiran ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = "none";
                                        e.target.nextElementSibling.style.display = "flex";
                                    }}
                                />
                                {/* Fallback */}
                                <div className="hidden absolute inset-0 items-center justify-center text-gray-600 text-[10px] font-semibold">
                                    Gagal
                                </div>
                                {/* Expand icon */}
                                <div className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                    <Maximize2 size={10} className="text-white" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* TOMBOL AKSI STICKY BOTTOM */}
            <div
                className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full px-6 pb-6 pt-10 bg-gradient-to-t from-[#121212] via-[#121212]/90 to-transparent z-20"
                style={{ maxWidth: "430px" }}
            >
                <button className="w-full font-black text-base py-4 rounded-2xl transition-all bg-ungu text-white active:bg-unguterang active:scale-[0.98] shadow-[0_10px_20px_rgba(149,100,221,0.3)]">
                    Ambil Gig Ini 🚀
                </button>
            </div>

        </div>
    );
}
