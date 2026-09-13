import { Search, Bell, Menu } from "lucide-react";
import { useNavigate } from "react-router";
import CategoryFilter from "../components/categoryfilter";

export default function Dashboard() {
    const navigate = useNavigate();

    return (
        <div className="mobile-container text-white overflow-x-hidden">

            <div className="flex flex-col gap-4">
                <div className="w-full flex justify-between items-center pb-3">
                    <div>
                        <h1 className="text-2xl font-black text-white">Yo, Ananda</h1>
                        <p className="text-sm text-gray-400">Mau cari apa di GIG?</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => navigate("/notifications")} className="p-2.5 rounded-2xl bg-dark border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors">
                            <Bell size={18} />
                        </button>
                        <button className="p-2.5 rounded-2xl bg-dark border border-gray-700 text-gray-300">
                            <Menu size={18} />
                        </button>
                    </div>
                </div>

                <label className="cursor-text">
                    <span className="flex items-center bg-dark border-[1.5px] border-gray-600 px-3 py-3 rounded-2xl focus-within:border-ungu">
                        <Search className="text-white-400 shrink-0 mr-2" size={18} />
                        <input
                        type="text"
                        placeholder="Explore gig, jasa"
                        className="flex-1 bg-transparent outline-none text-sm placeholder:text-white-400"
                        />
                    </span>
                </label>

                <CategoryFilter />
            </div>
        </div>     
    );
}