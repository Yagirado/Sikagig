import {
    BookOpen, Palette, Motorbike, Code, PieChart, ShoppingBag, Timer,
    Hand, HeartHandshake, Gamepad2, Camera, MonitorPlay, Sparkles,
    LayoutDashboard,
} from "lucide-react";
import jokiIcon from "../../assets/joki.webp";
import desainIcon from "../../assets/desigin.webp";
import anterinIcon from "../../assets/anterin.webp";
import codingIcon from "../../assets/coding.webp";
import surveyIcon from "../../assets/survey.webp";
import jastipIcon from "../../assets/jastip.webp";
import antriinIcon from "../../assets/antriin.webp";
import fisikIcon from "../../assets/fisik.webp";
import curhatIcon from "../../assets/curhat.webp";
import mabarIcon from "../../assets/mabar.webp";
import fotoIcon from "../../assets/foto.webp";
import editIcon from "../../assets/edit.webp";
import randomIcon from "../../assets/random.webp";
import { useEffect, useRef, useState } from "react";
import BottomNavbar from "../../components/bottomnavbar";
import ExploreHead from "./exploreHead";
import GigCards from "./gigCards";
import JasaCards from "./jasaCards";
import useGigPagination from "../../lib/useGigPagination";

const categories = [
    { name: "Semua", icon: LayoutDashboard, image: null },
    { name: "Joki Tugas", icon: BookOpen, image: jokiIcon },
    { name: "Desain Grafis", icon: Palette, image: desainIcon },
    { name: "Anterin", icon: Motorbike, image: anterinIcon },
    { name: "Coding", icon: Code, image: codingIcon },
    { name: "Survey & Data", icon: PieChart, image: surveyIcon },
    { name: "Jastip", icon: ShoppingBag, image: jastipIcon },
    { name: "Antriin", icon: Timer, image: antriinIcon },
    { name: "Fisik", icon: Hand, image: fisikIcon },
    { name: "Curhat", icon: HeartHandshake, image: curhatIcon },
    { name: "Hiburan & Mabar", icon: Gamepad2, image: mabarIcon },
    { name: "Fotografi & Video", icon: Camera, image: fotoIcon },
    { name: "Editing", icon: MonitorPlay, image: editIcon },
    { name: "Random", icon: Sparkles, image: randomIcon },
];

export default function Explore(){
    const [activeTab, setActiveTab] = useState("bantu");
    const [activeUrutan, setActiveUrutan] = useState(0);  
    const [search, setSearch] = useState(""); 
    const searchQuery = search.trim().toLowerCase();  
    const [categorySelection, setCatgorySelection] = useState({
        source: "bar",
        names: [],
    });
    const sort = ["random", "newest", "highest_paid"][activeUrutan];
    const [seed] = useState(
        () => Math.floor(Math.random() * 2147483647) + 1
    );

    const selectedCategories = categorySelection.names;
    const params = new URLSearchParams({
        search: searchQuery,
        sort,
        seed: String(seed),
    })

    selectedCategories.forEach((name) => {
        params.append("categories[]", name);
    })

    const queryString = params.toString();

    const { gigs, loading, error, hasMore, loadMore } = useGigPagination(queryString);
    
    const sentinelRef = useRef(null);

    useEffect(() => {
        if( activeTab !== "bantu" || loading || error || !hasMore ) return;

        const target = sentinelRef.current;
        if(!target) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if(entry.isIntersecting) {
                    loadMore();
                }
            },
            {
                rootMargin: "200px",
            }
        );

        observer.observe(target);

        return () => observer.disconnect();
    }, [ activeTab, loading, error, hasMore, loadMore, queryString ]);

    function selectedCategory(name){
        setCatgorySelection((prev) => {
            const names = name === "Semua" ? [] : [name];
        
            if(
                prev.source === "bar" &&
                prev.names.length === names.length &&
                prev.names[0] === names[0]
            ) return prev;
        
            return { source: "bar", names};
        });
    }

    function toggleFilterCategory(name){
        setCatgorySelection((prev) => {
            if(name === "Semua") return { source: "bar", names: []}

            const current = prev.names;

            const next = current.includes(name) 
                ? current.filter((item) => item != name)
                : [...current, name]

            return { source: next.length > 0 ? "filter" : "bar", names: next }
        });
    }

    function handleTabChange(nextTab){
            if(nextTab === activeTab) return;

            setActiveTab(nextTab);
        }

    
    return(
        <div className="mobile-container py-0!">
            <ExploreHead
                categories={categories}
                search={search}
                setSearch={setSearch}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                selectedCategories={selectedCategories}
                onCategorySelect={selectedCategory}
                onFilterToggle={toggleFilterCategory}
                activeUrutan={activeUrutan}
                setActiveUrutan={setActiveUrutan}
            />
            
            {activeTab === "bantu" ? (
                <>
                    <GigCards 
                        gigs={gigs}
                        loading={loading && gigs.length === 0}
                        error={gigs.length === 0 ? error : ""}
                        search={search}
                        searchQuery={searchQuery}
                        categories={categories}
                    />
                    <div className="pb-24 text-center text-sm text-gray-400">
                    {loading && gigs.length > 0 && (
                        <div
                            role="status"
                            className="flex items-center justify-center py-6"
                        >
                            <span
                                aria-hidden="true"
                                className="
                                    h-7 w-7 animate-spin rounded-full
                                    border-[3px] border-unguterang/20
                                    border-b-unguterang
                                "
                            />
                        </div>
                    )}

                    {error && (
                        <div role="status">
                            {gigs.length > 0 && 
                                <p className="mt-4">
                                    {error}
                                </p>
                            }

                            <button
                                type="button"
                                onClick={loadMore}
                                className="mt-2 mb-8 rounded-xl bg-ungu px-4 py-2 text-white"
                            >
                                Coba lagi
                            </button>
                        </div>
                    )}

                    {!loading && !error && !hasMore && gigs.length > 0 && (
                        <p className="mt-4">
                            Semua gig sudah ditampilkan.
                        </p>
                    )}

                    <div
                        ref={sentinelRef}
                        aria-hidden="true"
                        className="h-1"
                    />
                </div>
            </>
                ) : (
                    <JasaCards />
                )}
            
            <BottomNavbar />
        </div>
    )
}
