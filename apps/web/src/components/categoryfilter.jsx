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

export default function CategoryFilter() {
    const [selectedCategory, setSelectedCategory] = useState(null);

    const categories = [
        {name: "Antriin", icon: antriinIcon},
        {name: "Jastip", icon: jastipIcon},
        {name: "Anterin", icon: anterinIcon},
        {name: "Teman Curhat", icon: curhatIcon},
        {name: "Teman Mabar", icon: mabarIcon},
        {name: "Desain Grafis", icon: desainIcon},
        {name: "Fotografi", icon: fotoIcon},
        {name: "Video Editing", icon: editIcon},
        {name: "Programming", icon: codingIcon},
        {name: "Joki Tugas", icon: jokiIcon},
        {name: "Bantuan Fisik", icon: fisikIcon},
        {name: "Survey", icon: surveyIcon},
        {name: "Lainnya (Random)", icon: randomIcon},
    ];

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-lg text-white">
                    Cari Berdasarkan Kategori
                </h3>
                <button className="text-unguterang text-sm font-medium flex items-center gap-1">
                    Lihat semua
                </button>
            </div>

            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                {categories.map((category) => (
                    <button
                        key={category.name}
                        onClick={() => setSelectedCategory(category.name)}
                        className="flex flex-col items-center gap-2 shrink-0 group">
                        <div
                            className={`w-16 h-16 rounded-2xl border flex items-center justify-center overflow-hidden transition-all duration-300 ${
                                selectedCategory === category.name
                                    ? "border-unguterang bg-[#1a1a1a] shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                                    : "border-gray-800 bg-[#121212] active:border-gray-600 active:bg-[#1a1a1a]"
                            }`}>
                            {category.icon && (
                                <img 
                                    src={category.icon} 
                                    alt={category.name} 
                                    className="w-10 h-10 object-contain active:scale-110 transition-transform duration-300" 
                                />
                            )}
                        </div>
                        <span className={`text-[11px] whitespace-nowrap transition-colors tracking-wide
                        ${ selectedCategory === category.name ? "text-unguterang font-bold": "text-gray-400 active:text-gray-200 font-semibold"}`}>
                            {category.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}