import { Search } from "lucide-react";
import jasa from "../../assets/jasa.webp";
import bantu from "../../assets/bantu.webp";
import { useState } from "react";
import BottomNavbar from "../../components/bottomnavbar";

const tabs = [
                {id:"bantu", label:"Butuh dibantu", image:bantu},
                {id:"jasa", label:"Tawaran jasa", image:jasa},
            ];

const categories = ["Semua", "Antriin","Titip Beli", "Nemenin", "Creative","Desain Grafis","Video Editing", "Fotografi", "Programming", "Konseling", "Fisik", "Digital", "Random"]; 

export default function Explore(){
    const [activeTab, setActiveTab] = useState("bantu");
    const [activeCategory, setActiveCategory] = useState(0);

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
                                onClick={() => setActiveCategory(index)}
                                className={`relative shrink-0 whitespace-nowrap
                                    px-2 pb-2 font-bold text-sm cursor-pointer transition-colors
                                    ${activeCategory === index
                                        ? "text-unguterang"
                                        : "text-gray-400"}`}
                            >
                                {category}
                                {activeCategory === index && (
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

                <div className="flex text-white gap-2">
                    <button>
                        <span>Urutan</span>
                    </button>
                    <button>
                        <p>Filter</p>
                    </button>
                </div>
            </header>


            <BottomNavbar />
        </div>
    )
}