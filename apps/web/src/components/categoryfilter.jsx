import { useState } from "react";

export default function CategoryFilter() {

    const categories = [
        {name: "Antriin", icon: null},
        {name: "Titip Beli", icon: null},
        {name: "Nemenin", icon: null},
        {name: "Creative", icon: null},
        {name: "Desain Grafis", icon: null},
        {name: "Video Editing", icon: null},
        {name: "Fotografi", icon: null},
        {name: "Programming", icon: null},
        {name: "Konseling", icon: null},
        {name: "Fisik", icon: null},
        {name: "Digital", icon: null},
        {name: "Random", icon: null},
    ];

    const [selectedCategory, setSelectedCategory] = useState(null);

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

            <div className="flex gap-4 overflow-x-auto scrollbar-none">
                {categories.map((category) => (
                    <button
                        key={category.name}
                        onClick={() => setSelectedCategory(category.name)}
                        className="flex flex-col items-center gap-2 shrink-0">
                        <div
                            className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${
                                selectedCategory === category.name
                                    ? "border-unguterang bg-neutral-800"
                                    : "border-gray-700 bg-neutral-900"
                            }`}>
                        </div>
                        <span className={`text-sm whitespace-nowrap transition-colors 
                        ${ selectedCategory === category.name ? "text-unguterang font-bold": "text-white"}`}>
                            {category.name}
                        </span>
                    </button>
                ))}
                {/* icon kosong dulu, nanti diisi img/svg */}
            </div>
        </div>
    );
}