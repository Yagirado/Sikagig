import { ArrowRight, ArrowLeft, MoreVertical, ArrowUpRight, Clock, Flame, Coffee } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getCategoryIcon } from "../lib/categories";

export default function CardJob({ title = "Gig rekomendasi buat kamu", endpoint = "/api/gigs", variant = "primary" }) {
    const cardsRef = useRef(null);
    const [jobs, setJobs] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        async function getJobs() {
            const response = await fetch(endpoint, {
                credentials: "include",
                headers: { Accept: "application/json" },
            });

            if (!response.ok) return;

            const data = await response.json();
            setJobs(data.gigs || []);
        }

        getJobs();
    }, [endpoint]);

    function scrollCards(direction) {
        cardsRef.current?.scrollBy({
            left: direction * 280, // Scroll sejauh lebar card
            behavior: "smooth",
        });
    }

    const isLight = variant === "light";
    const bgClass = isLight ? "bg-white text-[#1a1a1a]" : "bg-ungu text-white";
    const secondaryText = isLight ? "text-gray-500" : "text-white/70";
    const iconBgClass = isLight ? "bg-gray-100" : "bg-white/20";
    const actionBtnClass = isLight ? "bg-ungu text-white" : "bg-white text-ungu";

    return (
        <section className="w-full pt-2">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-white">
                    {title}
                </h2>
                <button type="button" aria-label={`Lihat semua ${title}`}
                    className="p-2 rounded-2xl bg-dark border border-gray-700 text-gray-300 active:bg-gray-800 active:scale-95 transition-all">
                    <ArrowRight size={15} />
                </button>
            </div>

            {/* WRAPPER SCROLL */}
            <div className="relative group">
                {/* KIRI */}
                <button 
                    type="button" 
                    onClick={() => scrollCards(-1)}
                    aria-label="Geser ke kiri"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-700 text-white shadow-lg active:bg-white active:text-[#1a1a1a] active:scale-95 transition-all"
                >
                    <ArrowLeft size={18} />
                </button>
                
                {/* KANAN */}
                <button 
                    type="button" 
                    onClick={() => scrollCards(1)}
                    aria-label="Geser ke kanan"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-700 text-white shadow-lg active:bg-white active:text-[#1a1a1a] active:scale-95 transition-all"
                >
                    <ArrowRight size={18} />
                </button>

                <div ref={cardsRef} className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar -mx-6 px-6 relative">
                {jobs.length === 0 ? (
                    <div role="status" className="w-full min-w-full rounded-3xl border border-dashed border-gray-700 bg-dark px-5 py-10 text-center snap-center">
                        <p className="font-bold text-white">Belum ada job saat ini</p>
                        <p className="mt-2 text-sm text-gray-400">
                            Coba cek lagi nanti
                        </p>
                    </div>
                ) : (
                    jobs.map((job) => {
                        
                        const urgencyText = (job.urgency || "Santai").toLowerCase();
                        let UrgencyIcon = Coffee;
                        let urgencyColor = isLight ? "text-green-600" : "text-green-300";
                        let urgencyBg = isLight ? "bg-green-100" : "bg-green-400/20";
                        
                        if (urgencyText === "segera") {
                            UrgencyIcon = Clock;
                            urgencyColor = isLight ? "text-yellow-600" : "text-yellow-300";
                            urgencyBg = isLight ? "bg-yellow-100" : "bg-yellow-400/20";
                        } else if (urgencyText === "mendesak") {
                            UrgencyIcon = Flame;
                            urgencyColor = isLight ? "text-red-600" : "text-red-300";
                            urgencyBg = isLight ? "bg-red-100" : "bg-red-400/20";
                        }

                        return (
                            <article 
                                key={job.id}
                                onClick={() => navigate("/gig/" + job.id)}
                                className={`w-[85vw] max-w-[320px] shrink-0 flex flex-col p-4 rounded-3xl ${bgClass} shadow-xl cursor-pointer active:scale-[0.98] transition-all snap-center`}
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
                                    <button className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${isLight ? 'border-gray-300 active:bg-gray-100' : 'border-white/20 active:bg-white/10'}`}>
                                        <MoreVertical size={14} />
                                    </button>
                                </div>
                                
                                {/* HARGA & JUDUL */}
                                <div className="mt-1 mb-4">
                                    <div className="flex items-end gap-1 mb-1">
                                        <h2 className="text-2xl font-black tracking-tight">
                                            Rp {Number(job.budget).toLocaleString('id-ID')}
                                        </h2>
                                        <span className={`text-xs mb-0.5 ${secondaryText}`}>/ job</span>
                                    </div>
                                    <p className={`text-xs font-semibold line-clamp-2 ${isLight ? 'text-gray-800' : 'text-white/90'}`}>
                                        {job.title}
                                    </p>
                                </div>
                                
                                {/* FOOTER */}
                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] mb-1 ${isLight ? 'text-gray-500' : 'text-white/60'}`}>Tingkat Urgensi</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${urgencyBg}`}>
                                                <UrgencyIcon size={12} className={urgencyColor} />
                                            </div>
                                            <span className="text-xs font-bold tracking-wide capitalize">
                                                {job.urgency || "Santai"}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* TOMBOL */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform ${actionBtnClass}`}>
                                        <ArrowUpRight size={20} strokeWidth={2.5} />
                                    </div>
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
