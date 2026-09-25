import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Briefcase, MapPin, CheckCircle2, X, ChevronLeft, ChevronRight, FileText, Maximize2, ExternalLink, Calendar, Clock, Check } from "lucide-react";
import { getCategoryIcon } from "../../../lib/categories";

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
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPaket, setSelectedPaket] = useState(0);
    const [lightboxIdx, setLightboxIdx] = useState(null);

    /* FETCH DATA JASA */
    useEffect(() => {
        async function fetchJasa() {
            try {
                const res = await fetch(`/api/jasas/${id}`, {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });
                if (!res.ok) throw new Error("Jasa tidak ditemukan");
                const data = await res.json();
                setJasa(data.jasa);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchJasa();
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
    if (error || !jasa) {
        return (
            <div className="mobile-container bg-[#121212] min-h-screen pb-24 text-white flex flex-col items-center justify-center">
                <p className="text-xl font-bold mb-4">{error || "Terjadi kesalahan"}</p>
                <button onClick={() => navigate(-1)} className="px-6 py-3 bg-ungu rounded-xl font-bold active:scale-95 transition-all">
                    Kembali
                </button>
            </div>
        );
    }

    const portfolioList = parseList(jasa.portfolio);
    const rawPackages = parseList(jasa.packages);

    
    const activePakets = rawPackages.length > 0
        ? rawPackages.filter((p) => p.tampilkan !== false)
        : [];

    /* JIKA TIDAK ADA PAKET, BUAT 1 PAKET DEFAULT DARI INFO JASA */
    const paketList = activePakets.length > 0 ? activePakets : [
        {
            nama: "Paket Standar",
            harga: jasa.price,
            deskripsi: jasa.description,
            estimasi: "1-3 hari kerja",
            revisi: "2",
            termasukList: ["Pengerjaan sesuai deskripsi", "Konsultasi kebutuhan"]
        }
    ];

    /* PAKET TERPILIH */
    const currentPaket = paketList[selectedPaket] || paketList[0];

    /* HARGA BOTTOM BUTTON */
    const displayPrice = Number(currentPaket?.harga || jasa.price || 0);

    return (
        <div className="mobile-container text-white bg-[#121212] min-h-screen pb-32 relative">

            {/* LIGHTBOX */}
            {lightboxIdx !== null && (
                <ImageLightbox
                    photos={portfolioList}
                    startIndex={lightboxIdx}
                    onClose={() => setLightboxIdx(null)}
                />
            )}

            {/* HEADER STICKY */}
            <div className="flex items-center gap-4 px-6 py-4 -mx-6 -mt-6 sticky top-0 bg-[#121212]/95 backdrop-blur-md z-20 border-b border-gray-800">
                <button type="button" onClick={() => navigate(-1)} className="p-2 active:bg-gray-800 active:scale-95 transition-all rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold line-clamp-1">Detail Jasa</h1>
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

                    {/* TANGGAL PUBLISH */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <Calendar size={13} className="text-gray-500" />
                        <span>{formatTanggalIndo(jasa.created_at)}</span>
                    </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-4 tracking-tight">
                    {jasa.name}
                </h2>
            </div>

            {/* CARD MULAI DARI & ESTIMASI */}
            <div className="rounded-3xl bg-[#1a1a1a] border border-gray-800 p-5 mb-6 flex items-center justify-between">
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
                        <Clock size={12} className="text-unguterang" /> Estimasi
                    </span>
                    <p className="text-sm font-bold text-white">
                        {currentPaket?.estimasi || "1-3 hari kerja"}
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
                <p className="text-sm leading-relaxed text-gray-200 whitespace-pre-line">
                    {jasa.description || "Tidak ada deskripsi yang diberikan."}
                </p>
            </div>

            {/* YANG PERLU DISIAPKAN JURAGAN (SELALU MUNCUL) */}
            <div className="mb-6">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
                    Yang Perlu Disiapkan Juragan
                </p>
                <div className="glass-card rounded-3xl p-5 border border-ungu/20 bg-ungu/5">
                    <p className="text-sm leading-relaxed text-gray-200">
                        {jasa.brief_requirements
                            ? jasa.brief_requirements
                            : "Siapkan detail kebutuhan pekerjaan Anda, materi atau file pendukung (jika ada), serta instruksi yang jelas agar Jagoan dapat langsung mengerjakan dengan maksimal setelah pesanan dibuat."}
                    </p>
                </div>
            </div>

            {/* SECTION PILIH PAKET (VERTICAL CARDS SEPERTI REFERENSI GAMBAR) */}
            <div className="mb-6">
                <div className="mb-3 ml-1">
                    <h4 className="text-lg font-black text-white">Pilih Paket</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Beli langsung tanpa nego harga. Jagoan tinggal konfirmasi, lalu pengerjaan dimulai.
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    {paketList.map((p, idx) => {
                        const isSelected = selectedPaket === idx;
                        const termasuk = Array.isArray(p.termasukList)
                            ? p.termasukList
                            : parseList(p.termasukList);

                        return (
                            <div
                                key={idx}
                                onClick={() => setSelectedPaket(idx)}
                                className={`cursor-pointer rounded-3xl p-5 transition-all relative border active:scale-[0.99] ${
                                    isSelected
                                        ? "bg-[#1d1826] border-ungu ring-1 ring-ungu shadow-[0_4px_20px_rgba(149,100,221,0.2)]"
                                        : "bg-[#181818] border-gray-800 active:border-gray-700"
                                }`}
                            >
                                {/* BADGE PALING SERING DIPILIH / REKOMENDASI */}
                                {idx === 1 && paketList.length > 2 && (
                                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-ungu/15 text-unguterang text-[10px] font-bold mb-3 border border-ungu/30">
                                        <span>☆ Paling sering dipilih</span>
                                    </div>
                                )}

                                {/* HEADER CARD: NAMA & HARGA */}
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h5 className="text-base sm:text-lg font-black text-white leading-snug">
                                        {p.nama || `Paket ${idx + 1}`}
                                    </h5>
                                    <span className="text-base sm:text-lg font-black text-unguterang shrink-0">
                                        Rp {Number(p.harga || 0).toLocaleString("id-ID")}
                                    </span>
                                </div>

                                {/* DESKRIPSI PAKET */}
                                {p.deskripsi && (
                                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-3">
                                        {p.deskripsi}
                                    </p>
                                )}

                                {/* META ESTIMASI & REVISI */}
                                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3.5 font-medium">
                                    {p.estimasi && (
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={13} className="text-gray-400" />
                                            {p.estimasi}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5">
                                        🔄 {p.revisi ? `${p.revisi} revisi` : "2 revisi"}
                                    </span>
                                </div>

                                {/* LIST FITUR TERMASUK */}
                                {termasuk.length > 0 && (
                                    <div className="space-y-2 pt-3 border-t border-gray-800/80">
                                        {termasuk.map((item, i) => (
                                            <div key={i} className="flex items-start gap-2.5 text-xs text-gray-300">
                                                <div className="w-4 h-4 rounded-full bg-ungu/20 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Check size={11} className="text-unguterang stroke-[3]" />
                                                </div>
                                                <span className="leading-tight">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* INDIKATOR STATUS PILIHAN */}
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

            {/* PORTOFOLIO / LAMPIRAN (MENDUKUNG MULTIPLE FOTO & PDF) */}
            {portfolioList.length > 0 && (
                <div className="mb-6">
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
                                    {/* Expand icon */}
                                    <div className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                        <Maximize2 size={10} className="text-white" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TOMBOL AKSI STICKY BOTTOM (1 BUTTON DI BAWAH) */}
            <div
                className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full px-6 pb-6 pt-8 bg-gradient-to-t from-[#121212] via-[#121212]/95 to-transparent z-20"
                style={{ maxWidth: "430px" }}
            >
                <button
                    type="button"
                    className="w-full font-black text-base py-4 rounded-2xl transition-all bg-ungu active:bg-unguterang text-white active:scale-[0.98] shadow-[0_10px_25px_rgba(149,100,221,0.3)] flex items-center justify-center gap-2"
                >
                    <span>Beli {currentPaket?.nama || "Paket"}</span>
                    <span>•</span>
                    <span>Rp {displayPrice.toLocaleString("id-ID")} →</span>
                </button>
            </div>

        </div>
    );
}
