import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
    ArrowLeft,
    Briefcase,
    MapPin,
    CheckCircle2,
    Check,
    X,
    ChevronLeft,
    ChevronRight,
    FileText,
    Maximize2,
    ExternalLink,
    Calendar,
    Clock,
    Heart,
    Edit3,
    Trash2,
    Power,
    ShoppingBag,
} from "lucide-react";
import { getCategoryIcon } from "../../../lib/categories";
import { getCsrfToken } from "../../../lib/api";
import KonfirmasiOrderModal from "./KonfirmasiOrderModal";
import EditJasaModal from "../../activity/EditJasaModal";
import PesananMasukModal from "../../activity/PesananMasukModal";

/* BASE URL STORAGE: DEV PAKAI PORT LARAVEL, PROD PAKAI SAME ORIGIN */
const STORAGE = import.meta.env.DEV ? "http://localhost:8000/storage" : "/storage";

const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatTanggalIndo(dateStr) {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
        return dateStr;
    }
}

/* HELPER: PARSE FIELD (BISA ARRAY, JSON STRING, ATAU STRING BIASA) */
function parseList(raw) {
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

/* LIGHTBOX UNTUK GAMBAR DAN DOKUMEN */
function ImageLightbox({ photos, startIndex, onClose }) {
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

    const item = photos[current];
    const isPdf = typeof item === "string" && item.toLowerCase().endsWith(".pdf");

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4" onClick={onClose}>
            {/* Close */}
            <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center z-10 active:bg-white/20 active:scale-95 transition-all" onClick={onClose}>
                <X size={20} className="text-white" />
            </button>
            {/* Counter */}
            <p className="absolute top-5 left-1/2 -translate-x-1/2 text-xs text-gray-400 font-bold">
                {current + 1} / {photos.length}
            </p>

            {/* Content */}
            <div className="max-w-[90vw] max-h-[80vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                {isPdf ? (
                    <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-[#1a1a1a] border border-gray-800 text-center max-w-sm">
                        <span className="text-6xl">📄</span>
                        <div>
                            <p className="text-white font-bold text-base mb-1">Dokumen PDF Portofolio</p>
                            <p className="text-gray-400 text-xs truncate max-w-xs">{item.split("/").pop()}</p>
                        </div>
                        <a
                            href={`${STORAGE}/${item}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-ungu active:bg-unguterang text-white rounded-xl font-bold text-sm active:scale-95 transition-all"
                        >
                            <ExternalLink size={16} /> Buka / Unduh Dokumen
                        </a>
                    </div>
                ) : (
                    <img
                        src={`${STORAGE}/${item}`}
                        alt={`Portofolio ${current + 1}`}
                        className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                    />
                )}
            </div>

            {/* Nav */}
            {photos.length > 1 && (
                <>
                    <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 active:bg-white/20 active:scale-90 flex items-center justify-center transition-all">
                        <ChevronLeft size={20} className="text-white" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 active:bg-white/20 active:scale-90 flex items-center justify-center transition-all">
                        <ChevronRight size={20} className="text-white" />
                    </button>
                </>
            )}
        </div>
    );
}

export default function DetailJasa() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [jasa, setJasa] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPaket, setSelectedPaket] = useState(0);
    const [lightboxIdx, setLightboxIdx] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showOrdersModal, setShowOrdersModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    /* FETCH DATA JASA, AUTH USER & FAVORITE STATUS */
    useEffect(() => {
        let ignore = false;
        async function fetchJasa() {
            try {
                const res = await fetch(`/api/jasas/${id}`, {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });
                if (!res.ok) throw new Error("Jasa tidak ditemukan");
                const data = await res.json();
                if (!ignore) setJasa(data.jasa);
            } catch (err) {
                if (!ignore) setError(err.message);
            } finally {
                if (!ignore) setIsLoading(false);
            }
        }

        async function fetchCurrentUser() {
            try {
                const res = await fetch("/api/auth/me", {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });
                const data = await res.json();
                if (!ignore && res.ok && data.user) {
                    setCurrentUser(data.user);
                }
            } catch {
                // SILENT
            }
        }

        async function fetchFavoriteStatus() {
            try {
                const res = await fetch(`/api/favorites/status?type=jasa&target_id=${id}`, {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });
                const data = await res.json();
                if (!ignore && res.ok) {
                    setIsFavorited(data.favorited || false);
                }
            } catch {
                // SILENT
            }
        }

        fetchJasa();
        fetchCurrentUser();
        fetchFavoriteStatus();

        return () => {
            ignore = true;
        };
    }, [id, refreshKey]);

    // TOGGLE FAVORIT
    const handleToggleFavorite = async () => {
        const prev = isFavorited;
        setIsFavorited(!prev);
        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch("/api/favorites/toggle", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({ type: "jasa", target_id: Number(id) }),
            });
            const data = await res.json();
            if (res.ok) {
                setIsFavorited(data.favorited);
            } else {
                setIsFavorited(prev);
            }
        } catch {
            setIsFavorited(prev);
        }
    };

    // TOGGLE STATUS JASA (AKTIF / NONAKTIF)
    const handleToggleStatus = async () => {
        setActionLoading(true);
        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch(`/api/jasas/${id}/toggle-status`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
            });
            const data = await res.json();
            if (res.ok) {
                setJasa((prev) => (prev ? { ...prev, status: data.status } : prev));
            } else {
                alert(data.message || "Gagal mengubah status jasa.");
            }
        } catch {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setActionLoading(false);
        }
    };

    // HAPUS JASA
    const handleDeleteJasa = async () => {
        if (!window.confirm("Apakah kamu yakin ingin menghapus jasa ini?")) return;
        setActionLoading(true);
        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch(`/api/jasas/${id}`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
            });
            const data = await res.json();
            if (res.ok) {
                navigate("/activity");
            } else {
                alert(data.message || "Gagal menghapus jasa.");
            }
        } catch {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setActionLoading(false);
        }
    };

    /* SKELETON LOADER */
    if (isLoading) {
        return (
            <div className="mobile-container bg-[#121212] min-h-screen pb-28 text-white">
                <div className="flex items-center gap-4 px-6 py-4 -mx-6 -mt-6 border-b border-gray-800 animate-pulse">
                    <div className="w-8 h-8 bg-gray-800 rounded-full" />
                    <div className="h-6 w-32 bg-gray-800 rounded-lg" />
                </div>
                <div className="mt-8 space-y-4">
                    <div className="h-10 w-3/4 bg-gray-800 rounded-lg animate-pulse" />
                    <div className="h-8 w-1/2 bg-gray-800 rounded-lg animate-pulse mt-2" />
                </div>
                <div className="mt-8 glass-card p-4 rounded-3xl h-24 animate-pulse" />
                <div className="mt-6 glass-card p-4 rounded-3xl h-64 animate-pulse" />
            </div>
        );
    }

    /* ERROR STATE */
    if (error || !jasa) {
        return (
            <div className="mobile-container bg-[#121212] min-h-screen pb-28 text-white flex flex-col items-center justify-center">
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

    const isOwner = currentUser && jasa.user_id && Number(currentUser.id) === Number(jasa.user_id);
    const isActive = (jasa.status || "active") === "active";
    const ordersCount = jasa.orders_count ?? 0;

    // Normalisasi list paket
    let rawPaket = [];
    if (Array.isArray(jasa.packages)) {
        rawPaket = jasa.packages;
    } else if (typeof jasa.packages === "string") {
        try {
            rawPaket = JSON.parse(jasa.packages);
        } catch {
            rawPaket = [];
        }
    }

    const fallbackPaket = [
        {
            nama: "Standar",
            harga: Number(jasa.price) || 0,
            durasi: "3 Hari",
            revisi: "2x",
            deskripsi: jasa.description || "Layanan standar jagoan.",
            fitur: [],
        },
    ];

    const listPaket = rawPaket.length > 0 ? rawPaket : fallbackPaket;
    const currentPaket = listPaket[selectedPaket] || listPaket[0];
    const displayPrice = Number(currentPaket?.harga || currentPaket?.price || jasa.price || 0);
    const priceDigits = String(Math.trunc(displayPrice));
    const displayPriceLabel = priceDigits.length > 9
        ? `${Number(priceDigits.slice(0, 9)).toLocaleString("id-ID")}...`
        : displayPrice.toLocaleString("id-ID");

    // Parse list portofolio
    const portfolioList = parseList(jasa.portfolio);

    return (
        <div className="mobile-container pt-4! pb-20! text-white bg-[#121212] min-h-screen pb-36 relative">

            {/* LIGHTBOX */}
            {lightboxIdx !== null && (
                <ImageLightbox
                    photos={portfolioList}
                    startIndex={lightboxIdx}
                    onClose={() => setLightboxIdx(null)}
                />
            )}

            {/* HEADER STICKY */}
            <div className="flex items-center justify-between px-6 py-4 -mx-6 -mt-6 sticky top-0 bg-[#121212]/95 backdrop-blur-md z-20 border-b border-gray-800">
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate(-1)} className="p-2 active:bg-gray-800 active:scale-95 transition-all rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold line-clamp-1">Detail Jasa</h1>
                </div>

                {/* TOMBOL FAVORIT */}
                <button
                    type="button"
                    onClick={handleToggleFavorite}
                    className="p-2.5 rounded-full bg-[#1e1e1e] border border-gray-800 active:scale-90 transition-transform"
                    title={isFavorited ? "Hapus dari Favorit" : "Simpan ke Favorit"}
                >
                    <Heart
                        size={20}
                        className={isFavorited ? "text-rose-500 fill-rose-500 transition-colors" : "text-gray-400 transition-colors"}
                    />
                </button>
            </div>

            {/* HERO SECTION */}
            <div className="mt-6 mb-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#1e1e1e] border border-gray-700/80 shadow-sm">
                        <span className="relative h-4 w-4 shrink-0 flex items-center justify-center">
                            <img
                                src={getCategoryIcon(jasa.category)}
                                alt=""
                                className="h-6 w-6 max-w-none object-contain"
                            />
                        </span>
                        <span className="text-xs font-bold text-gray-200">{jasa.category || "Jasa"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {isOwner && (
                            <span className="px-2.5 py-1 rounded-full bg-ungu/20 border border-unguterang/40 text-unguterang text-[11px] font-bold">
                                Lapak Saya
                            </span>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                            <Calendar size={13} className="text-gray-500" />
                            <span>{formatTanggalIndo(jasa.created_at)}</span>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-4 tracking-tight">
                    {jasa.name}
                </h2>
            </div>

            {/* CARD RINGKASAN PESANAN & ESTIMASI */}
            <div
                onClick={() => isOwner && setShowOrdersModal(true)}
                className={`rounded-3xl bg-[#1a1a1a] border border-gray-800 p-5 mb-6 flex items-center justify-between ${
                    isOwner ? "cursor-pointer active:scale-[0.99] hover:border-unguterang/40 transition-all" : ""
                }`}
            >
                <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Mulai Dari
                    </span>
                    <h3 className="text-2xl font-black text-white">
                        Rp {Number(jasa.price || 0).toLocaleString("id-ID")}
                    </h3>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1 flex items-center justify-end gap-1">
                        <ShoppingBag size={12} className="text-unguterang" /> Pesanan
                    </span>
                    <p className="text-sm font-bold text-unguterang flex items-center gap-1 justify-end">
                        <span>{ordersCount} Orang Order</span>
                        {isOwner && <span className="text-[10px] bg-ungu/30 px-1.5 py-0.5 rounded text-unguterang">Lihat</span>}
                    </p>
                </div>
            </div>

            {/* INFORMASI PROVIDER */}
            <div className="glass-card rounded-3xl p-5 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-ungu to-unguterang flex items-center justify-center p-0.5 relative">
                        <div className="w-full h-full bg-dark rounded-full flex items-center justify-center text-lg font-bold">
                            {jasa.user?.fullName ? jasa.user.fullName.charAt(0) : "A"}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-[#121212] rounded-full p-0.5">
                            <CheckCircle2 size={15} className="text-unguterang" />
                        </div>
                    </div>
                    <div>
                        <p className="font-bold text-base leading-tight">{jasa.user?.fullName || "Penyedia Jasa"}</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Briefcase size={12} /> Jagoan Sikagig
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-gray-800/80 rounded-xl text-xs font-bold text-gray-300 border border-gray-700 flex items-center gap-1.5 capitalize">
                        <MapPin size={12} className="text-unguterang" /> {jasa.type || "Online"}
                    </div>
                </div>
            </div>

            {/* DESKRIPSI LAYANAN */}
            <div className="glass-card rounded-3xl p-6 mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Deskripsi Layanan</h4>
                <p className="max-h-[120px] overflow-y-auto text-sm leading-relaxed text-gray-200 whitespace-pre-line">
                {jasa.description || "Tidak ada deskripsi yang diberikan."}
                </p>
            </div>

            {/* PILIHAN PAKET JASA */}
            <div className="mb-6">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
                    Pilihan Paket ({listPaket.length})
                </p>
                <div className="space-y-3">
                    {listPaket.map((pkg, idx) => {
                        const isSelected = selectedPaket === idx;
                        const pkgPrice = Number(pkg.harga || pkg.price || 0);

                        return (
                            <div
                                key={idx}
                                onClick={() => setSelectedPaket(idx)}
                                className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                                    isSelected
                                        ? "bg-ungu/10 border-unguterang shadow-lg shadow-ungu/10"
                                        : "bg-[#18181c] border-gray-800 hover:border-gray-700"
                                }`}
                            >
                                <div className="flex min-w-0 items-start justify-between gap-3 mb-2">
                                    <div className="min-w-0 max-w-[340px] flex-1">
                                        <h5 className="break-words line-clamp-2 font-black text-base text-white">{pkg.nama || `Paket ${idx + 1}`}</h5>
                                        <p className="mt-0.5 break-words line-clamp-2 text-xs text-gray-400">{pkg.deskripsi || "Detail paket"}</p>
                                    </div>
                                    <div className="shrink-0 whitespace-nowrap text-right">
                                        <span className="text-base font-black text-unguterang whitespace-nowrap">
                                            Rp {pkgPrice.toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800/60 text-xs text-gray-400">
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={12} className="text-unguterang" />
                                        {pkg.durasi || pkg.estimasi || "3 Hari"}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <CheckCircle2 size={12} className="text-green-400" />
                                        {pkg.revisi ? `${pkg.revisi} Revisi` : "2x Revisi"}
                                    </span>
                                </div>

                                {pkg.fitur && Array.isArray(pkg.fitur) && pkg.fitur.length > 0 && (
                                    <div className="mt-3 space-y-1.5 pt-2 border-t border-gray-800/40">
                                        {pkg.fitur.map((fitur, fIdx) => (
                                            <div key={fIdx} className="flex items-center gap-2 text-xs text-gray-300">
                                                <Check size={13} className="text-unguterang shrink-0" />
                                                <span>{fitur}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-4 pt-3 border-t border-gray-800/60 flex items-center justify-between text-xs font-bold">
                                    <span className={isSelected ? "text-unguterang" : "text-gray-500"}>
                                        {isSelected ? "● Paket Sedang Dipilih" : "○ Klik untuk pilih paket ini"}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* PORTOFOLIO / LAMPIRAN */}
            {portfolioList.length > 0 && (
                <div className="mb-14 pb-4">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
                        Portofolio & Lampiran ({portfolioList.length})
                    </p>
                    <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar">
                        {portfolioList.map((item, idx) => {
                            const isPdf = typeof item === "string" && item.toLowerCase().endsWith(".pdf");
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setLightboxIdx(idx)}
                                    className="relative shrink-0 w-[110px] h-[110px] rounded-2xl overflow-hidden border border-gray-800 bg-[#1a1a1a] active:border-gray-700 active:scale-95 transition-all text-left"
                                >
                                    {isPdf ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gray-800/40 p-2">
                                            <div className="p-2.5 bg-ungu/15 rounded-xl">
                                                <FileText size={24} className="text-unguterang" />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-300 truncate w-full text-center">
                                                PDF Dokumen
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <img
                                                src={`${STORAGE}/${item}`}
                                                alt={`Portofolio ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = "none";
                                                    e.target.nextElementSibling.style.display = "flex";
                                                }}
                                            />
                                            <div className="hidden absolute inset-0 items-center justify-center text-gray-600 text-[10px] font-semibold">
                                                Foto
                                            </div>
                                        </>
                                    )}
                                    <div className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                        <Maximize2 size={10} className="text-white" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TOMBOL AKSI STICKY BOTTOM */}
            <div
                className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full px-4 pb-5 pt-8 bg-gradient-to-t from-[#121212] via-[#121212]/95 to-transparent z-20"
                style={{ maxWidth: "430px" }}
            >
                {isOwner ? (
                    /* AKSI KHUSUS PEMILIK JASA */
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowOrdersModal(true)}
                            className="flex-1 py-3.5 px-3 rounded-2xl font-black text-xs sm:text-sm bg-ungu text-white active:bg-unguterang active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-ungu/20"
                        >
                            <ShoppingBag size={16} />
                            <span>Pesanan ({ordersCount})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowEditModal(true)}
                            className="p-3.5 rounded-2xl bg-[#2a2a2a] border border-gray-700 text-gray-200 active:scale-95 transition-all"
                            title="Edit Jasa"
                        >
                            <Edit3 size={16} />
                        </button>

                        <button
                            type="button"
                            disabled={actionLoading}
                            onClick={handleToggleStatus}
                            className={`p-3.5 rounded-2xl border active:scale-95 transition-all flex items-center justify-center gap-1 text-xs font-bold disabled:opacity-50 ${
                                isActive
                                    ? "bg-red-500/15 border-red-500/40 text-red-400"
                                    : "bg-green-500/15 border-green-500/40 text-green-400"
                            }`}
                            title={isActive ? "Nonaktifkan Jasa" : "Aktifkan Jasa"}
                        >
                            <Power size={16} />
                            <span>{isActive ? "Nonaktif" : "Aktifkan"}</span>
                        </button>

                        <button
                            type="button"
                            disabled={actionLoading}
                            onClick={handleDeleteJasa}
                            className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 active:scale-95 transition-all disabled:opacity-50"
                            title="Hapus Jasa"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ) : (
                    /* TOMBOL ORDER UNTUK PEMBELI */
                    <button
                        type="button"
                        onClick={() => setShowOrderModal(true)}
                        className="w-full font-black text-base py-4 rounded-2xl transition-all bg-ungu active:bg-unguterang text-white active:scale-[0.98] shadow-[0_10px_25px_rgba(149,100,221,0.3)] flex items-center justify-center gap-2"
                    >
                        <span>Beli {currentPaket?.nama || "Paket"}</span>
                        <span>•</span>
                        <span>Rp {displayPriceLabel}</span>
                    </button>
                )}
            </div>

            {/* MODAL KONFIRMASI ORDER */}
            {showOrderModal && (
                <KonfirmasiOrderModal
                    jasa={jasa}
                    paket={currentPaket}
                    price={displayPrice}
                    onClose={() => setShowOrderModal(false)}
                />
            )}

            {/* MODAL EDIT JASA */}
            {showEditModal && (
                <EditJasaModal
                    jasa={jasa}
                    onClose={() => setShowEditModal(false)}
                    onRefresh={() => setRefreshKey((k) => k + 1)}
                />
            )}

            {/* MODAL PESANAN MASUK */}
            {showOrdersModal && (
                <PesananMasukModal
                    jasaId={jasa.id}
                    onClose={() => setShowOrdersModal(false)}
                    onRefresh={() => setRefreshKey((k) => k + 1)}
                />
            )}
        </div>
    );
}
