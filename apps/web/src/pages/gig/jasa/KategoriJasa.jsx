import { useState } from "react";
import { Timer, Palette, Monitor, Wrench, Camera, HeartHandshake, Coffee, Code, Sparkles, Share2, ShoppingBag, Video } from "lucide-react";

export default function KategoriJasa() {
    const [selectedCategory, setSelectedCategory] = useState("");
    
    const categories = [
        { name: "Antriin", icon: Timer },
        { name: "Desain Grafis", icon: Palette },
        { name: "Digital", icon: Monitor },
        { name: "Fisik", icon: Wrench },
        { name: "Fotografi", icon: Camera },
        { name: "Konseling", icon: HeartHandshake },
        { name: "Nemenin", icon: Coffee },
        { name: "Ngoding", icon: Code },
        { name: "Random", icon: Sparkles },
        { name: "Referral", icon: Share2 },
        { name: "Titip Beli", icon: ShoppingBag },
        { name: "Edit Video", icon: Video }
    ];

    return (
        <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Kategori</label>
            <div className="flex flex-wrap gap-2">
                <input type="hidden" name="kategori_jasa" value={selectedCategory} />
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <button 
                            type="button"
                            key={cat.name}
                            onClick={() => setSelectedCategory(cat.name)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${
                                selectedCategory === cat.name 
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
