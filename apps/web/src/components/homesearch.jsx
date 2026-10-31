import { useState, useEffect } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router";

export default function HomeSearch() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("butuh");
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    useEffect(() => {
        const query = searchQuery.trim();

        const timerId = setTimeout(async () => {
            if (!query) {
                setSuggestions([]);
                setIsLoadingSuggestions(false);
                return;
            }

            setIsLoadingSuggestions(true);

            try {
                const endpoint = activeTab === "butuh"
                    ? `/api/gigs?search=${encodeURIComponent(query)}&sort=newest`
                    : `/api/jasas?search=${encodeURIComponent(query)}&sort=newest`;

                const res = await fetch(endpoint, {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });
                if (!res.ok) throw new Error("fetch failed");
                const data = await res.json();

                const items = activeTab === "butuh"
                    ? (data.gigs ?? [])
                    : (data.jasas ?? []);

                setSuggestions(items.slice(0, 6));
            } catch (e) {
                console.error(e);
                setSuggestions([]);
            } finally {
                setIsLoadingSuggestions(false);
            }
        }, query ? 350 : 0);

        return () => clearTimeout(timerId);
    }, [searchQuery, activeTab]);

    return (
        <div className="mobile-container text-white min-h-screen p-1!">

            <div className="relative flex items-center justify-center py-5 mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute left-4 p-2.5 rounded-full bg-neutral-900 border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors active:scale-95"
                >
                    <ArrowLeft size={18} />
                </button>
                <h1 className="text-xl font-bold text-white text-center">
                    Lagi butuh apa?
                </h1>
            </div>

            {/* Search input */}
            <div className="mb-6 mx-1">
                <div className="flex items-center bg-neutral-900 border border-gray-700 px-3 py-2.5 rounded-full focus-within:border-unguterang transition-colors">
                    <Search className="text-gray-400 shrink-0 mr-2" size={17} />
                    <input
                        type="text"
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={
                            activeTab === "butuh" ? "mau dibantu apa..." : "mau bantuin apa..."
                        }
                        className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-gray-500"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800 mb-8">
                <button
                    onClick={() => setActiveTab("butuh")}
                    className={`flex-1 pb-3 text-sm font-semibold transition-colors relative ${activeTab === "butuh" ? "text-unguterang" : "text-gray-400"}`}
                >
                    Butuh dibantu
                    {activeTab === "butuh" && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-unguterang rounded-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("tawaran")}
                    className={`flex-1 pb-3 text-sm font-semibold transition-colors relative ${activeTab === "tawaran" ? "text-unguterang" : "text-gray-400"}`}
                >
                    Tawaran jasa
                    {activeTab === "tawaran" && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-unguterang rounded-full" />
                    )}
                </button>
            </div>

            {/* Results / Empty state */}
            {searchQuery.trim() === "" ? (
                <div className="text-center py-12 space-y-2">
                    <h3 className="font-bold text-lg text-white">Mulai ketik keyword</h3>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">
                        Contoh: &ldquo;jasa antar barang atau bikin makalah&rdquo;
                    </p>
                </div>
            ) : isLoadingSuggestions ? (
                <div className="text-center py-12 space-y-2">
                    <h3 className="font-bold text-lg text-white">Mencari...</h3>
                </div>
            ) : suggestions.length > 0 ? (
                <div className="space-y-1">
                    {suggestions.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => navigate(activeTab === "butuh" ? `/gig/${item.id}` : `/jasa/${item.id}`)}
                            className="w-full flex items-center gap-3 px-3 py-3.5 text-left rounded-xl hover:bg-neutral-900 active:bg-neutral-800 transition-colors"
                        >
                            <Search size={14} className="text-gray-500 shrink-0" />
                            <span className="text-sm text-white truncate">
                                {activeTab === "butuh" ? item.title : item.name}
                            </span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 space-y-2">
                    <h3 className="font-bold text-lg text-white">Tidak ada hasil</h3>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">
                        Coba kata kunci lain
                    </p>
                </div>
            )}
        </div>
    );
}
