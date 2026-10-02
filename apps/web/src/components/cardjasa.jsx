import { ArrowRight, ArrowLeft, Star } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { getCategoryIcon } from "../lib/categories";

function formatWaktuLalu(dateString, now) {
    if (!dateString) return "";

    const timestamp = new Date(dateString).getTime();
    if (!Number.isFinite(timestamp)) return "";

    const menit = Math.floor(Math.max(0, now - timestamp) / 60_000);
    const jam = Math.floor(menit / 60);
    const hari = Math.floor(jam / 24);

    if (hari >= 1) return `${hari}h lalu`;
    if (jam >= 1) return `${jam}j lalu`;
    return `${menit}m lalu`;
}

export default function CardJasa({ title = "Jasa rekomendasi buat kamu", endpoint = "/api/jasas", variant = "primary" }) {
    const cardsRef = useRef(null);
    const [jasas, setJasas] = useState([]);
    const [now, setNow] = useState(() => Date.now());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCount, setRetryCount] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let ignore = false;
        async function getJasas() {
            setLoading(true);
            setError("");
            try {
                const response = await fetch(endpoint, {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });
                if (!response.ok) throw new Error("Gagal memuat daftar jasa.");
                const data = await response.json();
                if (!ignore) setJasas(data.jasas || []);
            } catch {
                if (!ignore) setError("Gagal memuat daftar jasa. Periksa koneksi lalu coba lagi.");
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        getJasas();
        return () => { ignore = true; };
    }, [endpoint, retryCount]);

    const checkScrollBounds = useCallback(() => {
        const el = cardsRef.current;
        if (!el || jasas.length === 0) {
            setCanScrollLeft(false);
            setCanScrollRight(false);
            return;
        }

        const isAtStart = el.scrollLeft <= 2;
        const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;

        setCanScrollLeft(!isAtStart);
        setCanScrollRight(!isAtEnd);
    }, [jasas]);

    useEffect(() => {
        const el = cardsRef.current;
        if (!el) return;

        checkScrollBounds();

        el.addEventListener("scroll", checkScrollBounds);
        window.addEventListener("resize", checkScrollBounds);

        return () => {
            el.removeEventListener("scroll", checkScrollBounds);
            window.removeEventListener("resize", checkScrollBounds);
        };
    }, [jasas, checkScrollBounds]);

    function scrollCards(direction) {
        cardsRef.current?.scrollBy({
            left: direction * 280, 
            behavior: "smooth",
        });
    }

    const isLight = variant === "light";
    const bgClass = isLight ? "bg-light text-black" : "bg-ungu text-white";
    const secondaryText = isLight ? "text-gray-800" : "text-white/80";
    const iconBgClass = isLight ? "bg-unguterang/40" : "bg-white/20";

    return (
        <section className="w-full pt-2">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-white">
                    {title}
                </h2>
                <button type="button" aria-label={`Lihat semua ${title}`}
                    className="p-2 rounded-2xl bg-dark border border-gray-700 text-gray-300 active:bg-gray-800 active:scale-95 transition-all cursor-pointer">
                    <ArrowRight size={15} />
                </button>
            </div>

            {/* WRAPPER SCROLL */}
            <div className="relative group">
                {/* KIRI */}
                {jasas.length > 0 && canScrollLeft &&(
                    <button 
                        type="button" 
                        onClick={() => scrollCards(-1)}
                        aria-label="Geser ke kiri"
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-700 text-white shadow-lg active:bg-white active:text-[#1a1a1a] active:scale-95 transition-all"
                    >
                        <ArrowLeft size={18} />
                    </button>
                )}

                {/* KANAN */}
                {jasas.length > 0 && canScrollRight &&(
                    <button 
                        type="button" 
                        onClick={() => scrollCards(1)}
                        aria-label="Geser ke kanan"
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-700 text-white shadow-lg active:bg-white active:text-[#1a1a1a] active:scale-95 transition-all"
                    >
                        <ArrowRight size={18} />
                    </button>
                )}
                
                <div ref={cardsRef} className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar -mx-6 px-6 relative">
                {loading ? (
                    <div role="status" className="flex w-full min-w-full justify-center py-10 snap-center">
                        <span aria-hidden="true" className="h-7 w-7 animate-spin rounded-full border-[3px] border-unguterang/20 border-b-unguterang" />
                        <span className="sr-only">Memuat jasa...</span>
                    </div>
                ) : error ? (
                    <div className="w-full min-w-full rounded-3xl border border-dashed border-gray-700 bg-dark px-5 py-8 text-center snap-center">
                        <p role="alert" className="text-sm text-red-400">{error}</p>
                        <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="mt-4 rounded-xl bg-ungu px-4 py-2 text-sm font-bold text-white">
                            Coba lagi
                        </button>
                    </div>
                ) : jasas.length === 0 ? (
                    <div role="status" className="w-full min-w-full rounded-3xl border border-dashed border-gray-700 bg-dark px-5 py-10 text-center snap-center">
                        <p className="font-bold text-white">Belum ada jasa saat ini</p>
                        <p className="mt-2 text-sm text-gray-400">
                            Coba cek lagi nanti
                        </p>
                    </div>
                ) : (
                    jasas.map((jasa) => {
                        const ratingCount = Number(jasa.rating_count ?? 0);
                        const ratingAverage = jasa.rating_average == null ? NaN : Number(jasa.rating_average);
                        const hasRating = ratingCount > 0 && Number.isFinite(ratingAverage) && ratingAverage >= 1 && ratingAverage <= 5;

                        return (
                            <article 
                                key={jasa.id}
                                onClick={() => navigate("/jasa/" + jasa.id)}
                                className={`w-[80vw] max-w-[300px] shrink-0 flex flex-col p-4 rounded-3xl ${bgClass} shadow-xl cursor-pointer active:scale-[0.98] transition-all snap-center`}
                            >
                                {/* HEADER */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center p-1.5 backdrop-blur-sm ${iconBgClass}`}>
                                            <img
                                                src={getCategoryIcon(jasa.category)}
                                                alt=""
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="font-bold text-sm leading-tight">{jasa.category || "Jasa"}</h3>
                                            <span className={`text-[11px] flex items-center gap-1 mt-0.5 ${secondaryText}`}>
                                                By {jasa.user?.fullName || "Anonim"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* JUDUL, DESKRIPSI & HARGA */}
                                <div className="mt-1 mb-4 pb-4 border-b border-gray-400">
                                    <h2 className={`min-h-[2.75rem] wrap-break-words text-lg font-black leading-snug line-clamp-2 mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                        {jasa.name}
                                    </h2>
                                    <p className={`min-h-[2.5rem] wrap-break-words line-clamp-2 text-xs leading-relaxed ${secondaryText}`}>
                                        {jasa.description || "Deskripsi belum tersedia."}
                                    </p>
                                    <div className="mt-3">
                                        <span className={`block text-[10px] ${isLight ? 'text-gray-500' : 'text-white/60'}`}>Mulai dari</span>
                                        <span className="text-sm font-extrabold">
                                            Rp {Number(jasa.price).toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* FOOTER */}
                                <div className="flex items-center justify-between gap-2 mt-auto">
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] mb-1 ${isLight ? 'text-gray-500' : 'text-white/60'}`}>Rating Jasa</span>
                                        <div className="flex items-center gap-2">
                                            {hasRating && (
                                                <Star size={13} className={isLight ? 'text-orange-500' : 'text-orange-300'} fill="currentColor" />
                                            )}
                                            <span className={`text-xs font-bold tracking-wide ${hasRating ? "" : secondaryText}`}>
                                                {hasRating ? `${ratingAverage.toFixed(1)} (${ratingCount})` : "Belum ada rating"}
                                            </span>
                                        </div>
                                    </div>
                                    {jasa.created_at && formatWaktuLalu(jasa.created_at, now) && (
                                        <time
                                            dateTime={jasa.created_at}
                                            title={new Date(jasa.created_at).toLocaleString("id-ID")}
                                            className={`ml-2 shrink-0 text-right text-[10px] ${secondaryText}`}
                                        >
                                            {formatWaktuLalu(jasa.created_at, now)}
                                        </time>
                                    )}
                                </div>
                            </article>
                        );
                    })
                )}
            </div>
            </div>
        </section>
    );
}
