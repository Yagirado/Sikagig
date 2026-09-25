import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Briefcase, MapPin, CheckCircle2 } from "lucide-react";

/* BASE URL STORAGE: DEV PAKAI PORT LARAVEL, PROD PAKAI SAME ORIGIN */
const STORAGE = import.meta.env.DEV ? "http://localhost:8000/storage" : "/storage";

/* HELPER: PARSE PORTFOLIO FIELD (BISA STRING TUNGGAL, JSON ARRAY, ATAU COMMA-SEPARATED) */
function parsePortfolio(raw) {
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

export default function DetailJasa() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [jasa, setJasa] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 bg-ungu rounded-xl font-bold active:scale-95 transition-all"
                >
                    Kembali
                </button>
            </div>
        );
    }

    /* PARSE PORTFOLIO */
    const portfolioList = parsePortfolio(jasa.portfolio);

    return (
        <div className="mobile-container text-white bg-[#121212] min-h-screen pb-28 relative">

            {/* HEADER STICKY */}
            <div className="flex items-center gap-4 px-6 py-4 -mx-6 -mt-6 sticky top-0 bg-[#121212]/90 backdrop-blur-md z-20 border-b border-gray-800">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="p-2 active:bg-gray-800 active:scale-95 transition-all rounded-full"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold line-clamp-1">Detail Jasa</h1>
            </div>

            {/* HERO SECTION */}
            <div className="mt-6 mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 mb-4">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-xs font-bold text-gray-300">{jasa.category || "Jasa"}</span>
                </div>
                <h2 className="text-3xl font-black leading-tight mb-4 tracking-tight">
                    {jasa.name}
                </h2>
                <div className="flex items-end gap-1">
                    <h3 className="text-4xl font-black text-white">
                        Rp {Number(jasa.price).toLocaleString("id-ID")}
                    </h3>
                    <span className="text-gray-400 mb-1">/ mulai dari</span>
                </div>
            </div>

            {/* INFORMASI PROVIDER */}
            <div className="glass-card rounded-3xl p-5 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center p-0.5 relative">
                        <div className="w-full h-full bg-dark rounded-full flex items-center justify-center text-xl font-bold">
                            {jasa.user?.fullName ? jasa.user.fullName.charAt(0) : "A"}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-[#121212] rounded-full p-0.5">
                            <CheckCircle2 size={16} className="text-blue-400" />
                        </div>
                    </div>
                    <div>
                        <p className="font-bold text-lg leading-tight">{jasa.user?.fullName || "Anonim"}</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Briefcase size={12} /> Provider Jasa
                        </p>
                    </div>
                </div>
                <button className="px-4 py-2 bg-gray-800 rounded-xl text-xs font-bold active:scale-95 active:bg-gray-700 transition-all border border-gray-700">
                    Lihat Profil
                </button>
            </div>

            {/* DESKRIPSI & INFO JASA */}
            <div className="glass-card rounded-3xl p-6 mb-6 space-y-5">
                <div>
                    <h4 className="text-sm font-bold text-gray-400 mb-2">Deskripsi Layanan</h4>
                    <p className="text-sm leading-relaxed text-gray-200">
                        {jasa.description || "Tidak ada deskripsi yang diberikan."}
                    </p>
                </div>

                <div className="pt-4 border-t border-gray-800/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-400/20">
                            <MapPin size={14} className="text-purple-400" />
                        </div>
                        <span className="font-bold text-sm capitalize">{jasa.type || "Online / Remote"}</span>
                    </div>
                </div>
            </div>

            {/* PAKET LAYANAN */}
            <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-400 mb-3 ml-2">Paket Layanan</h4>
                {jasa.packages && Array.isArray(jasa.packages) && jasa.packages.length > 0 ? (
                    <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar -mx-6 px-6">
                        {jasa.packages.map((paket, idx) => (
                            <div key={idx} className="shrink-0 w-[85%] snap-center rounded-3xl border border-gray-800 bg-[#1a1a1a] p-5">
                                <div className="flex justify-between items-start mb-2 gap-4">
                                    <h5 className="font-bold text-lg text-white">{paket.nama || `Paket ${idx + 1}`}</h5>
                                    <span className="font-bold text-blue-400 shrink-0">
                                        Rp {Number(paket.harga || 0).toLocaleString("id-ID")}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 mb-3">
                                    {paket.deskripsi || "Tidak ada deskripsi spesifik."}
                                </p>
                                <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-800/50">
                                    <span>⏱ {paket.estimasi || "-"}</span>
                                    <span>🔄 {paket.revisi || "-"}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-3xl border border-gray-800 bg-[#1a1a1a] p-5">
                        <div className="flex justify-between items-start mb-2">
                            <h5 className="font-bold text-lg text-white">Paket Standar</h5>
                            <span className="font-bold text-blue-400">
                                Rp {Number(jasa.price).toLocaleString("id-ID")}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-3">
                            {jasa.brief_requirements || "Layanan sesuai deskripsi utama. Hubungi provider untuk detail lebih lanjut."}
                        </p>
                    </div>
                )}
            </div>

            {/* PORTOFOLIO / HASIL KERJA */}
            <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-400 mb-3 ml-2">Portofolio</h4>

                {portfolioList.length > 0 ? (
                    portfolioList.length === 1 ? (
                        /* SATU PORTOFOLIO - TAMPIL FULL */
                        <div className="rounded-3xl overflow-hidden border border-gray-800 bg-[#1a1a1a]">
                            {portfolioList[0].toLowerCase().endsWith('.pdf') ? (
                                <div className="flex flex-col items-center justify-center p-6 h-64 bg-gray-800/50">
                                    <span className="text-4xl mb-4">📄</span>
                                    <span className="text-sm font-bold text-gray-300 mb-2 text-center">File PDF Portofolio</span>
                                    <a 
                                        href={`${STORAGE}/${portfolioList[0]}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                                    >
                                        Lihat Dokumen
                                    </a>
                                </div>
                            ) : (
                                <>
                                    <img
                                        src={`${STORAGE}/${portfolioList[0]}`}
                                        alt="Portofolio"
                                        className="w-full object-cover max-h-64"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                            e.target.nextElementSibling.style.display = "flex";
                                        }}
                                    />
                                    <div className="hidden w-full h-40 items-center justify-center text-gray-500 text-xs font-semibold">
                                        Portofolio tidak tersedia
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        /* LEBIH DARI SATU - SCROLL HORIZONTAL */
                        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar -mx-6 px-6">
                            {portfolioList.map((item, idx) => {
                                const isPdf = item.toLowerCase().endsWith('.pdf');
                                return (
                                    <div
                                        key={idx}
                                        className="shrink-0 w-[85%] snap-center rounded-3xl overflow-hidden border border-gray-800 bg-[#1a1a1a]"
                                    >
                                        {isPdf ? (
                                            <div className="flex flex-col items-center justify-center p-6 h-64 bg-gray-800/50">
                                                <span className="text-4xl mb-4">📄</span>
                                                <span className="text-sm font-bold text-gray-300 mb-2 text-center">File PDF Portofolio</span>
                                                <a 
                                                    href={`${STORAGE}/${item}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                                                >
                                                    Lihat Dokumen
                                                </a>
                                            </div>
                                        ) : (
                                            <>
                                                <img
                                                    src={`${STORAGE}/${item}`}
                                                    alt={`Portofolio ${idx + 1}`}
                                                    className="w-full object-cover max-h-64"
                                                    onError={(e) => {
                                                        e.target.style.display = "none";
                                                        e.target.nextElementSibling.style.display = "flex";
                                                    }}
                                                />
                                                <div className="hidden w-full h-40 items-center justify-center text-gray-500 text-xs font-semibold">
                                                    Portofolio tidak tersedia
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    /* KONDISI KOSONG */
                    <div className="rounded-3xl border border-dashed border-gray-800 bg-[#1a1a1a]/50 p-6 flex items-center justify-center text-gray-500">
                        <span className="text-xs font-semibold">Tidak ada portofolio yang dilampirkan</span>
                    </div>
                )}
            </div>

            {/* TOMBOL AKSI STICKY BOTTOM */}
            <div
                className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full px-6 pb-6 pt-10 bg-gradient-to-t from-[#121212] via-[#121212]/90 to-transparent z-20"
                style={{ maxWidth: "430px" }}
            >
                <button className="w-full font-black text-base py-4 rounded-2xl transition-all bg-blue-600 text-white active:bg-blue-700 active:scale-[0.98] shadow-[0_10px_20px_rgba(37,99,235,0.3)]">
                    Pesan Jasa Ini 🚀
                </button>
            </div>

        </div>
    );
}
