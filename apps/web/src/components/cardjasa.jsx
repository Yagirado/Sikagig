import { ArrowRight, ArrowLeft, MoreVertical, ArrowUpRight, Star } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router";

export default function CardJasa({ title = "Jasa rekomendasi buat kamu", endpoint = "/api/jasas", variant = "primary" }) {
    const cardsRef = useRef(null);
    const [jasas, setJasas] = useState([]);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        async function getJasas() {
            const response = await fetch(endpoint, {
                credentials: "include",
                headers: { Accept: "application/json" },
            });

            if (!response.ok) return;

            const data = await response.json();
            setJasas(data.jasas || []);
        }

        getJasas();
    }, [endpoint]);

    function cleanButtons() {
        const cards = cardsRef.current;
        if (!cards) return;

        const hasOverflow = cards.scrollWidth > cards.clientWidth + 2;
        setCanScrollLeft(hasOverflow && cards.scrollLeft > 2);
        setCanScrollRight(hasOverflow && cards.scrollLeft + cards.clientWidth < cards.scrollWidth - 2);
    }

    useEffect(() => {
        const cards = cardsRef.current;
        if (!cards) return;

        const frame = requestAnimationFrame(cleanButtons);
        const observer = new ResizeObserver(cleanButtons);
        observer.observe(cards);

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [jasas]);

    function scrollCards(direction) {
        cardsRef.current?.scrollBy({
            left: direction * 280, 
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
                    className="p-2 rounded-2xl bg-dark border border-gray-700 text-gray-300 active:bg-gray-800 transition-colors">
                    <ArrowRight size={15} />
                </button>
            </div>

            {/* WRAPPER SCROLL */}
            <div className="relative group">
                {/* KIRI */}
                {canScrollLeft && <button 
                    type="button" 
                    onClick={() => scrollCards(-1)}
                    aria-label="Geser ke kiri"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-700 text-white shadow-lg active:bg-white active:text-[#1a1a1a] transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>}
                
                {/* KANAN */}
                {canScrollRight && <button 
                    type="button" 
                    onClick={() => scrollCards(1)}
                    aria-label="Geser ke kanan"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-700 text-white shadow-lg active:bg-white active:text-[#1a1a1a] transition-colors"
                >
                    <ArrowRight size={18} />
                </button>}

                <div ref={cardsRef} onScroll={cleanButtons} className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar -mx-6 px-6 relative">
                {jasas.length === 0 ? (
                    <div role="status" className="w-full min-w-full rounded-3xl border border-dashed border-gray-700 bg-dark px-5 py-10 text-center snap-center">
                        <p className="font-bold text-white">Belum ada jasa saat ini</p>
                        <p className="mt-2 text-sm text-gray-400">
                            Coba cek lagi nanti
                        </p>
                    </div>
                ) : (
                    jasas.map((jasa) => {
                        return (
                            <article 
                                key={jasa.id}
                                onClick={() => navigate("/jasa/" + jasa.id)}
                                className={`w-[85vw] max-w-[320px] shrink-0 flex flex-col p-4 rounded-3xl ${bgClass} shadow-xl cursor-pointer active:-translate-y-1 transition-transform snap-center`}
                            >
                                {/* HEADER */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm ${iconBgClass}`}>
                                            <span className="font-bold text-base">{jasa.category ? jasa.category.charAt(0) : "J"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="font-bold text-sm leading-tight">{jasa.category || "Jasa"}</h3>
                                            <span className={`text-[11px] flex items-center gap-1 mt-0.5 ${secondaryText}`}>
                                                By {jasa.user?.fullName || "Anonim"}
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
                                            Rp {Number(jasa.price).toLocaleString('id-ID')}
                                        </h2>
                                        <span className={`text-xs mb-0.5 ${secondaryText}`}>/ mulai</span>
                                    </div>
                                    <p className={`text-xs font-semibold line-clamp-2 ${isLight ? 'text-gray-800' : 'text-white/90'}`}>
                                        {jasa.name}
                                    </p>
                                </div>
                                
                                {/* FOOTER */}
                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] mb-1 ${isLight ? 'text-gray-500' : 'text-white/60'}`}>Rating Jasa</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isLight ? 'bg-orange-100' : 'bg-orange-400/20'}`}>
                                                <Star size={12} className={isLight ? 'text-orange-500' : 'text-orange-300'} fill="currentColor" />
                                            </div>
                                            <span className="text-xs font-bold tracking-wide">
                                                5.0 <span className={secondaryText}>(Baru)</span>
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* TOMBOL */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md active:scale-105 transition-transform ${actionBtnClass}`}>
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
