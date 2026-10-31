import { useState } from "react";


import antriinIcon from "../assets/antriin.webp";
import jastipIcon from "../assets/jastip.webp";
import anterinIcon from "../assets/anterin.webp";
import curhatIcon from "../assets/curhat.webp";
import mabarIcon from "../assets/mabar.webp";
import desainIcon from "../assets/desigin.webp";
import fotoIcon from "../assets/foto.webp";
import editIcon from "../assets/edit.webp";
import codingIcon from "../assets/coding.webp";
import jokiIcon from "../assets/joki.webp";
import fisikIcon from "../assets/fisik.webp";
import randomIcon from "../assets/random.webp";
import surveyIcon from "../assets/survey.webp";
import { useNavigate } from "react-router";

export default function CategoryFilter() {
    const navigate = useNavigate();
    const [selectedCategory] = useState(null);

    const categories = [
        { name: "Antriin", value: "Antriin", icon: antriinIcon },
        { name: "Jastip", value: "Jastip", icon: jastipIcon },
        { name: "Anterin", value: "Anterin", icon: anterinIcon },
        { name: "Teman Curhat", value: "Curhat", icon: curhatIcon },
        { name: "Teman Mabar", value: "Hiburan & Mabar", icon: mabarIcon },
        { name: "Desain Grafis", value: "Desain Grafis", icon: desainIcon },
        { name: "Fotografi", value: "Fotografi & Video", icon: fotoIcon },
        { name: "Video Editing", value: "Editing", icon: editIcon },
        { name: "Programming", value: "Coding", icon: codingIcon },
        { name: "Joki Tugas", value: "Joki Tugas", icon: jokiIcon },
        { name: "Bantuan Fisik", value: "Fisik", icon: fisikIcon },
        { name: "Survey", value: "Survey & Data", icon: surveyIcon },
        { name: "Lainnya (Random)", value: "Random", icon: randomIcon },
    ];

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-lg text-white">
                    Cari Berdasarkan Kategori
                </h3>
                <button 
                    type="button"
                    onClick={() => navigate("/explore")}
                    className="text-unguterang text-sm font-medium flex items-center gap-1 cursor-pointer active:text-unguterang/70"
                >
                    Lihat semua
                </button>
            </div>

            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                {categories.map((category) => (
                    <button
                        key={category.value}
                        onClick={() => {
                            const params = new URLSearchParams({
                                category: category.value,
                            });

                            navigate(`/explore?${params.toString()}`);
                        }}
                        className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer">
                        <div
                            className={`bg-dark w-16 h-16 rounded-2xl border flex items-center justify-center overflow-hidden ${
                                selectedCategory === category.name
                                    ? "border-unguterang bg-dark/60 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                                    : "border-gray-800 bg-[#121212] group-active:border-gray-600 group-active:bg-dark/60"
                            }`}>
                            {category.icon && (
                                <img 
                                    src={category.icon} 
                                    alt={category.name}
                                    draggable="false" 
                                    loading="lazy"
                                    className="w-10 h-10 object-contain group-active:scale-95 transition-transform duration-300" 
                                />
                            )}
                        </div>
                        <span 
                            draggable="false"
                            className={`text-[11px] whitespace-nowrap transition-colors tracking-wide 
                            ${ selectedCategory === category.name ? "text-unguterang font-bold group-active:text-unguterang/60": "text-gray-400 font-semibold group-active:text-gray-200"}`}>
                            {category.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
