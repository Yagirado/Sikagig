import { useState } from "react";
import { BookOpen, Palette, Code, PieChart, ShoppingBag, HeartHandshake, Gamepad2, Sparkles, Hand, Timer, Motorbike, Camera, MonitorPlay } from "lucide-react";

export default function KategoriGig() {
    const [selectedCategory, setSelectedCategory] = useState("");

    const categories = [
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

    return (
        <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Kategori</label>
            <div className="flex flex-wrap gap-2">
                <input type="hidden" name="category" value={selectedCategory} />

                {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <button
                            type="button"
                            key={cat.name}
                            onClick={() => setSelectedCategory(cat.name)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${selectedCategory === cat.name
                                    ? 'bg-ungu text-white border-ungu'
                                    : 'bg-[#1a1a1a] text-gray-300 border-gray-800 hover:bg-gray-800'
                                }`}
                        >
                            <Icon size={14} />
                            {cat.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
