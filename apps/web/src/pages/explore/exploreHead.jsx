import { 
    Search, ListFilter, Funnel, X 
} from "lucide-react";
import { useEffect, useState } from "react";
import jasa from "../../assets/jasa.webp";
import bantu from "../../assets/bantu.webp";
import UrutanPopup from "./UrutanPopup";
import FilterPopup from "./FilterPopup";

const tabs = [
                {id:"bantu", label:"Butuh dibantu", image:bantu},
                {id:"jasa", label:"Tawaran jasa", image:jasa},
            ];

const urutan = ["Rekomendasi", "Terbaru", "Bayaran tertinggi"];

export default function ExploreHead({ 
    categories, search, setSearch, activeTab, onTabChange,  
    selectedCategories, onCategorySelect, 
    onFilterToggle, activeUrutan, setActiveUrutan
    }){
    const [showHeader, setShowHeader] = useState(true);
    const [showUrutan, setShowUrutan] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    
    const count = selectedCategories.length;
    const filterActive = count > 0;
    const activeCategory =
        count === 0
            ? "Semua"
            : count === 1
                ? selectedCategories[0]
                : null;

    useEffect(() => {
        let lastScrollY = Math.max(0, window.scrollY);
        const threshold = 8;

        const handleSCroll= () => {
            const currentScrollY = Math.max(0, window.scrollY);

            if(currentScrollY <= 60){
                setShowHeader(true);
                lastScrollY = currentScrollY;
                return;
            }

            const diff = currentScrollY - lastScrollY;

            if(Math.abs(diff) < threshold) return;

            setShowHeader(diff < 0);
            lastScrollY = currentScrollY;
        }

        window.addEventListener("scroll", handleSCroll, {passive: true});
    
        return () => {
            window.removeEventListener("scroll", handleSCroll);
        };
    }, []);

    return(
        <header
            onFocusCapture={() => setShowHeader(true)}
            className={`
                sticky top-0 z-50 bg-[#151515] pb-2 -mx-6 px-6
                transition-transform duration-450
                ease-[cubic-bezier(0.22,1,0.36,1)]
                motion-reduce:transition-none
                ${showHeader ? "translate-y-0" : "-translate-y-full"}
            `}
        >
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
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                maxLength={255}
                                placeholder="Coba cari disini..."
                                aria-label="Cari judul gig"
                                className="flex-1 min-w-0 outline-none" 
                            />
                    </label>
                </div>
                <div className="grid grid-cols-2 mt-3 text-gray-400 text-sm font-semibold border-b border-gray-800">
                    {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"   
                                onClick={() => onTabChange(tab.id)}
                                aria-pressed={activeTab === tab.id}
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
                {categories.map((category) => {
                    const isActive = activeCategory === category.name;
                        return (
                            <button
                                key={category.name}
                                type="button"
                                onClick={() => onCategorySelect(category.name)}
                                aria-pressed={isActive}
                                className={`
                                    relative shrink-0 whitespace-nowrap
                                    px-2 pb-2 font-bold text-sm
                                    cursor-pointer transition-colors
                                    ${isActive ? "text-unguterang" : "text-gray-400"}
                                `}
                            >
                                {category.name}

                                {isActive && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute bottom-0 left-1/2 h-[3.5px] w-10.5
                                            -translate-x-1/2 rounded-full bg-unguterang"
                                    />
                                )}
                            </button>
                        )    
                    }
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
                    className=
                        {`flex items-center justify-center gap-2 px-4 py-2.5 cursor-pointer
                        border border-gray-700 rounded-full text-[13px] font-bold
                        ${count > 0 ? "bg-unguterang" : "bg-dark"}`
                    }
                >
                    <Funnel strokeWidth={2.5} size={14} className="shrink-0"/>
                    <span>
                        Filter 
                    </span>
                    { count > 0 && (
                        <span 
                            className="inline-flex h-5 min-w-5 shrink-0 items-center
                                justify-center rounded-full bg-white px-1
                                text-[11px] font-bold text-ungu">
                            {count}
                        </span>
                    )}
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
                    selectedCategories={ filterActive ? selectedCategories : ["Semua"] }
                    onToggle={onFilterToggle}
                />

                {count > 0 && (
                    <div
                        aria-label="Kategori terpilih"
                        className="flex min-w-0 basis-full gap-2 overflow-x-auto
                            hide-scrollbar py-2"
                    >
                        {selectedCategories.map((name) => {
                            const Icon = categories.find(
                                (category) => category.name === name
                            )?.icon;

                            return (
                            <button
                                key={name}
                                type="button"
                                onClick={() => onFilterToggle(name)}
                                className="group flex items-center justify-center shrink-0 whitespace-nowrap rounded-full
                                    border border-gray-700 bg-dark cursor-pointer px-3 py-2 text-xs font-semibold
                                    active:bg-dark/60"
                            >
                                {Icon && <Icon size={14} strokeWidth={2.5} className="shrink-0 text-light mr-2 group-active:text-light/60" />}
                                <span className="text-white font-semibold group-active:text-white/60">
                                    {name}
                                </span>
                                <X size={14} strokeWidth={1.5} className="shrink-0 text-white ml-1 group-active:text-white/60" />
                            </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </header>
    )
}