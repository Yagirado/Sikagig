import {
    Search, ListFilter, Funnel,
    BookOpen, Palette, Motorbike, Code, PieChart, ShoppingBag, Timer,
    Hand, HeartHandshake, Gamepad2, Camera, MonitorPlay, Sparkles,
    LayoutDashboard,
} from "lucide-react";
import jasa from "../../assets/jasa.webp";
import bantu from "../../assets/bantu.webp";
import { useState } from "react";
import BottomNavbar from "../../components/bottomnavbar";
import UrutanPopup from "./UrutanPopup";
import FilterPopup from "./FilterPopup";

const tabs = [
                {id:"bantu", label:"Butuh dibantu", image:bantu},
                {id:"jasa", label:"Tawaran jasa", image:jasa},
            ];

const urutan = ["Rekomendasi", "Terbaru", "Bayaran tertinggi"];

const categories = [
        { name: "Semua", icon: LayoutDashboard },
        { name: "Joki Tugas", icon: BookOpen },
        { name: "Desain Grafis", icon: Palette },
        { name: "Anterin", icon: Motorbike },
        { name: "Coding", icon: Code },
        { name: "Survey & Data", icon: PieChart },
        { name: "Jastip", icon: ShoppingBag },
        { name: "Antriin", icon: Timer },
        { name: "Fisik", icon: Hand },
        { name: "Curhat", icon: HeartHandshake },
        { name: "Hiburan & Mabar", icon: Gamepad2 },
        { name: "Fotografi & Video", icon: Camera },
        { name: "Editing", icon: MonitorPlay },
        { name: "Random", icon: Sparkles }
    ];
    
export default function Explore(){
    const [activeTab, setActiveTab] = useState("bantu");
    const [activeUrutan, setActiveUrutan] = useState(0);
    const [showUrutan, setShowUrutan] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState(["Semua"]);

    function toggleCategory(name){
        setSelectedCategories((previous) => {
            if(name === "Semua") return ["Semua"]

            const categories = previous.filter((item) => item != "Semua");

            const next = categories.includes(name) 
                ? categories.filter((category) => category != name)
                : [...categories, name]

            return next.length > 0 ? next : ["Semua"]
        });
    }

    
    return(
        <div className="mobile-container py-0!">
            <header className="sticky top-0 z-50 bg-[#151515]">
                <div className="-mx-2.5 px-1.5 pt-2 pb-4">
                    <div>
                        <label 
                            className="
                                group flex items-center justify-start w-full bg-dark text-white 
                                px-2 py-4.5 rounded-full border-[0.5px] border-gray-800 cursor-text text-sm font-semibold
                                focus-within:border-unguterang">
                                <Search
                                    size={18}
                                    strokeWidth={2.5}
                                    className="mx-2 shrink-0 text-gray-500 group-focus-within:text-white"/>
                                <input 
                                    type="text"
                                    placeholder="Coba cari disini..."
                                    className="flex-1 min-w-0 outline-none" 
                                />
                        </label>
                    </div>
                    <div className="grid grid-cols-2 mt-3 text-gray-400 text-sm font-semibold border-b border-gray-800">
                        {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"   
                                    onClick={() => setActiveTab(tab.id)}
                                    className=
                                        {`relative flex flex-col items-center gap-1.5 pb-3.5
                                        cursor-pointer text-sm font-semibold transition-colors
                                        ${activeTab === tab.id ? "text-white" : "text-gray-400"}`}
                                >
                                    
                                    <img 
                                        src={tab.image} 
                                        alt="bantu"
                                        draggable="false"
                                        className="w-14 aspect-square object-contain"
                                    />
                                    <span>
                                        {tab.label}
                                    </span>
                                    {activeTab === tab.id && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute bottom-1 left-1/2 h-1 w-12
                                            -translate-x-1/2 rounded-full bg-white"
                                    />
                                    )}
                                </button>
                            )
                        )}
                    </div>
                </div>

                <div className=
                        "-mx-6 mt-2 px-3 flex border-b border-gray-700
                        overflow-x-auto scrollbar-width:none [&::-webkit-scrollbar]:hidden"
                >
                    {categories.map((category, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => toggleCategory(category.name)}
                                className={`relative shrink-0 whitespace-nowrap
                                    px-2 pb-2 font-bold text-sm cursor-pointer transition-colors
                                    ${selectedCategories.includes(category.name) === index
                                        ? "text-unguterang"
                                        : "text-gray-400"}`}
                            >
                                {category.name}
                                {selectedCategories.includes(category.name) === index && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute bottom-0 left-1/2 h-[3.5px] w-10.5
                                            -translate-x-1/2 rounded-full bg-unguterang"
                                    />
                                )}
                            </button>
                        )
                    )}
                </div>

                <div className="flex flex-wrap text-white gap-2 mt-3 -ml-2">
                    <button 
                        type="button"
                        onClick={() => setShowUrutan(true)}
                        aria-haspopup="dialog"
                        aria-expanded={showUrutan}
                        aria-controls="explore-urutan"
                        className="
                            flex items-center justify-center gap-2 px-4 py-2.5 cursor-pointer
                            bg-dark border border-gray-700 rounded-full text-[13px] font-bold"
                    >
                        <ListFilter size={14} strokeWidth={2.5} className="shrink-0"/>
                        <span>
                            Urutan: {urutan[activeUrutan]}
                        </span>
                    </button>

                    <button 
                        type="button"
                        onClick={() => setShowFilter(true)}
                        aria-haspopup="dialog"
                        aria-expanded={showFilter}
                        aria-controls="explore-filter"
                        className="
                            flex items-center justify-center gap-2 px-4 py-2.5 cursor-pointer
                            bg-dark border border-gray-700 rounded-full text-[13px] font-bold"
                    >
                        <Funnel strokeWidth={2.5} size={14} className="shrink-0"/>
                        <span>
                            Filter
                        </span>
                    </button>
                    <UrutanPopup
                        open={showUrutan}
                        onClose={() => setShowUrutan(false)}
                        urutan={urutan}
                        activeUrutan={activeUrutan}
                        onSelect={setActiveUrutan}
                    />
                    <FilterPopup
                        open={showFilter}
                        onClose={() => setShowFilter(false)}
                        categories={categories}
                        selectedCategories={selectedCategories}
                        onToggle={toggleCategory}
                    />

                    {selectedCategories.length > 0 && (
                        <div
                            aria-label="Kategori terpilih"
                            className="flex min-w-0 basis-full gap-2 overflow-x-auto
                                hide-scrollbar py-2"
                        >
                            {selectedCategories.map((name) => (
                                <span
                                    key={name}
                                    className="shrink-0 whitespace-nowrap rounded-full
                                        border border-unguterang bg-ungu/15
                                        px-3 py-2 text-xs font-semibold text-unguterang"
                                >
                                    {name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            

            <BottomNavbar />
        </div>
    )
}
