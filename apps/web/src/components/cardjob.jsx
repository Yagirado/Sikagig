import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export default function CardJob() {
    const cardsRef = useRef(null);
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const [recommendedJobs, setRecommendedJobs] = useState([]);

    useEffect(() => {
        async function getRecommendedJobs() {
            const response = await fetch("/api/gigs", {
                credentials: "include",
                headers: { Accept: "application/json" },
            });

            if (!response.ok) return;

            const data = await response.json();
            setRecommendedJobs(data.gigs);
        }

    getRecommendedJobs();
}, []);

    function scrollCards(direction) {
        cardsRef.current?.scrollBy({
            left: direction * 256,
            behavior: "smooth",
        });
    }

    function updateArrowVisibility(container) {
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;

        setCanGoBack(scrollLeft > 0);
        setCanGoForward(scrollLeft + clientWidth < scrollWidth - 1);
    }

    useEffect(() => {
        updateArrowVisibility(cardsRef.current);
    }, [recommendedJobs]);

    function handleScroll(event) {
        updateArrowVisibility(event.currentTarget);
    }

    return (
        <section className="w-full pt-2">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-white">
                    Gig rekomendasi buat kamu
                </h2>

                <button type="button" aria-label="Lihat semua gig rekomendasi"
                    className="p-2 rounded-2xl bg-dark border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors">
                    <ArrowRight size={15} />
                </button>
            </div>

            <div className="relative">
                <div ref={cardsRef} onScroll={handleScroll}
                    className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-2 scrollbar-none">
                    {recommendedJobs.length === 0 ? (
                        <div role="status" className="w-full rounded-3xl border border-dashed border-gray-700 bg-dark px-5 py-10 text-center">
                            <p className="font-bold text-white">Belum ada job saat ini</p>
                            <p className="mt-2 text-sm text-gray-400">
                                Coba cek lagi nanti
                            </p>
                        </div>
                    ) : (
                        recommendedJobs.map((job) => (
                            <article key={job.id}
                                className="h-52 w-60 shrink-0 rounded-3xl border border-gray-700 bg-dark p-5">
                                <h3 className="text-lg font-bold text-white">
                                    {job.title}
                                </h3>
                                <p className="mt-2 text-sm text-gray-400">
                                    {job.description}
                                </p>
                                <p className="mt-4 font-bold text-green-400">
                                    {job.budget}
                                </p>
                            </article>
                        ))
                    )}
                </div>

                {canGoBack && (<button type="button" onClick={() => scrollCards(-1)} aria-label="Kembali ke gig rekomendasi sebelumnya"
                        className="absolute left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gray-700 bg-dark text-white shadow-lg transition-colors active:bg-gray-800 md:flex">
                        <ArrowLeft size={22} />
                    </button>
                )}

                {canGoForward && (<button type="button" onClick={() => scrollCards(1)} aria-label="Geser gig rekomendasi berikutnya"
                        className="absolute right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gray-700 bg-dark text-white shadow-lg transition-colors active:bg-gray-800 md:flex">
                        <ArrowRight size={22} />
                    </button>
                )}
            </div>
        </section>
    );
}
