import { ArrowRight, ArrowLeft, Clock, Flame, Coffee } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { getCategoryIcon } from "../lib/categories";

const URGENCY_CONFIG = {
    santai: { icon: Coffee, lightColor: "text-green-600", darkColor: "text-green-300", lightBg: "bg-green-100", darkBg: "bg-green-400/20" },
    segera: { icon: Clock, lightColor: "text-yellow-600", darkColor: "text-yellow-300", lightBg: "bg-yellow-100", darkBg: "bg-yellow-400/20" },
    mendesak: { icon: Flame, lightColor: "text-red-600", darkColor: "text-red-300", lightBg: "bg-red-100", darkBg: "bg-red-400/20" },
};

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

export default function CardJob({ title = "Gig rekomendasi buat kamu", endpoint = "/api/gigs", variant = "primary" }) {
    const cardsRef = useRef(null);
    const [jobs, setJobs] = useState([]);
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
        async function getJobs() {
            setLoading(true);
            setError("");
            try {
                const response = await fetch(endpoint, {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });
                if (!response.ok) throw new Error("Gagal memuat daftar gig.");
                const data = await response.json();
                if (!ignore) setJobs(data.gigs || []);
            } catch {
                if (!ignore) setError("Gagal memuat daftar. Periksa koneksi lalu coba lagi.");
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        getJobs();
        return () => { ignore = true; };
    }, [endpoint, retryCount]);

    const checkScrollBounds = useCallback(() => {
        const el = cardsRef.current;
        if (!el || jobs.length === 0) {
            setCanScrollLeft(false);
            setCanScrollRight(false);
            return;
        }

        const isAtStart = el.scrollLeft <= 2;
        const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;

        setCanScrollLeft(!isAtStart);
        setCanScrollRight(!isAtEnd);
    }, [jobs]);

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
    }, [jobs, checkScrollBounds]);

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
                    <ArrowRight size={15} strokeWidth={3} />
                </button>
            </div>

            {/* WRAPPER SCROLL */}
            <div className="relative group">
                {/* TOMBOL KIRI */}
                {jobs.length > 0 && canScrollLeft && (
                    <button 
                        type="button" 
                        onClick={() => scrollCards(-1)}
                        aria-label="Geser ke kiri"
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-700 text-white shadow-lg active:bg-white active:text-[#1a1a1a] active:scale-95 transition-all cursor-pointer"
                    >
                        <ArrowLeft size={18} />
                    </button>
                )}
                
                {/* TOMBOL KANAN */}
                {jobs.length > 0 && canScrollRight && (
                    <button 
                        type="button" 
                        onClick={() => scrollCards(1)}
                        aria-label="Geser ke kanan"
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-700 text-white shadow-lg active:bg-white active:text-[#1a1a1a] active:scale-95 transition-all cursor-pointer"
                    >
                        <ArrowRight size={18} />
                    </button>
                )}

                <div ref={cardsRef} className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar -mx-6 px-6 relative">
                {loading ? (
                    <div role="status" className="flex w-full min-w-full justify-center py-10 snap-center">
                        <span aria-hidden="true" className="h-7 w-7 animate-spin rounded-full border-[3px] border-unguterang/20 border-b-unguterang" />
                        <span className="sr-only">Memuat gig...</span>
                    </div>
                ) : error ? (
                    <div className="w-full min-w-full rounded-3xl border border-dashed border-gray-700 bg-dark px-5 py-8 text-center snap-center">
                        <p role="alert" className="text-sm text-red-400">{error}</p>
                        <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="mt-4 rounded-xl bg-ungu px-4 py-2 text-sm font-bold text-white">
                            Coba lagi
                        </button>
                    </div>
                ) : jobs.length === 0 ? (
                    <div role="status" className="w-full min-w-full rounded-3xl border border-dashed border-gray-700 bg-dark px-5 py-10 text-center snap-center">
                        <p className="font-bold text-white">Belum ada job saat ini</p>
                        <p className="mt-2 text-sm text-gray-400">
                            Coba cek lagi nanti
                        </p>
                    </div>
                ) : (
                    jobs.map((job) => {
                        const urgency = URGENCY_CONFIG[(job.urgency || "santai").toLowerCase()] || URGENCY_CONFIG.santai;
                        const UrgencyIcon = urgency.icon;
                        const urgencyColor = isLight ? urgency.lightColor : urgency.darkColor;
                        const urgencyBg = isLight ? urgency.lightBg : urgency.darkBg;

                        return (
                            <article 
                                key={job.id}
                                onClick={() => navigate("/gig/" + job.id)}
                                className={`w-[80vw] max-w-75 shrink-0 flex flex-col p-4 rounded-3xl ${bgClass} shadow-xl cursor-pointer active:scale-[0.98] transition-all snap-center`}
                            >
                                {/* HEADER */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center p-1.5 backdrop-blur-sm ${iconBgClass}`}>
                                            <img
                                                src={getCategoryIcon(job.category)}
                                                alt=""
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="font-bold text-sm leading-tight">{job.category || "Gig"}</h3>
                                            <span className={`text-[11px] flex items-center gap-1 mt-0.5 ${secondaryText}`}>
                                                By {job.user?.fullName || "Anonim"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* JUDUL */}
                                <div className="mt-1 mb-4 pb-4 border-b border-gray-400">
                                    <h2 className={`min-h-[2.75rem] wrap-break-words text-lg font-black leading-snug line-clamp-2 mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                        {job.title}
                                    </h2>
                                    <p className={`min-h-[2.5rem] wrap-break-words line-clamp-2 text-xs leading-relaxed ${secondaryText}`}>
                                        {job.description || "Deskripsi belum tersedia."}
                                    </p>
                                    <div className="mt-3">
                                        <span className={`block text-[10px] font-semibold tracking-wider ${isLight ? 'text-gray-500' : 'text-white/60'}`}>
                                            {job.mode === "barengan" ? "Per orang" : "Budget"}
                                        </span>
                                        <span className="text-sm font-extrabold">
                                            Rp {Number(job.budget).toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* FOOTER */}
                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] mb-1 font-semibold ${isLight ? 'text-gray-500' : 'text-white/60'}`}>Tingkat Urgensi</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${urgencyBg}`}>
                                                <UrgencyIcon size={12} className={urgencyColor} />
                                            </div>
                                            <span className="text-xs font-bold tracking-wide capitalize">
                                                {job.urgency || "Santai"}
                                            </span>
                                        </div>
                                    </div>
                                    {job.created_at && formatWaktuLalu(job.created_at, now) && (
                                        <time
                                            dateTime={job.created_at}
                                            title={new Date(job.created_at).toLocaleString("id-ID")}
                                            className={`ml-3 shrink-0 text-right text-[10px] font-semibold tracking-wides ${secondaryText}`}
                                        >
                                            {formatWaktuLalu(job.created_at, now)}
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
