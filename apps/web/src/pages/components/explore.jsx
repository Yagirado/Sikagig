import { useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router";

export default function Explore() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("tawaran");
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="mobile-container text-white min-h-screen p-4">

            <div className="relative flex items-center justify-center py-2 mb-4">
                <button onClick={() => navigate(-1)} className="absolute left-0 p-2.5 rounded-2xl bg-neutral-900 border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors active:scale-95">
                    <ArrowLeft size={18} />
                </button>
                <h1 className="text-xl font-bold text-white text-center">
                    Lagi butuh apa?
                </h1>
            </div>

            <div className="flex items-center bg-neutral-900 border border-gray-700 px-3 py-3 rounded-2xl mb-6 focus-within:border-unguterang">
                <Search className="text-gray-400 shrink-0 mr-2" size={18} />
                <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                        activeTab === "butuh" ? "mau dibantu apa..." : "mau bantuin apa..."
                    }
                    className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-gray-500"/>
            </div>

            <div className="flex border-b border-gray-800 mb-8">
                <button onClick={() => setActiveTab("butuh")} className={`flex-1 pb-3 text-sm font-semibold transition-colors relative ${activeTab === "butuh" ? "text-white" : "text-gray-400"}`}>
                    Butuh dibantu
                    {activeTab === "butuh" && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-unguterang rounded-full" />)}
                </button>
                
                <button onClick={() => setActiveTab("tawaran")} className={`flex-1 pb-3 text-sm font-semibold transition-colors relative ${activeTab === "tawaran" ? "text-white" : "text-gray-400"}`}>
                    Tawaran jasa
                    {activeTab === "tawaran" && (<div className="absolute bottom-0 left-0 right-0 h-1 bg-unguterang rounded-full" />)}
                </button>
            </div>

            <div className="text-center py-12 space-y-2">
                <h3 className="font-bold text-lg text-white">Mulai ketik keyword</h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    Contoh: "jasa antar barang atau bikin makalah"
                </p>
            </div>
        </div>
    );
}