import { useLocation, useNavigate } from "react-router";
import { Home, Search, Plus, MessageSquare, Zap } from "lucide-react";

export default function BottomNavbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        {id: "home", label: "Beranda", icon: Home, path: "/dashboard"},
        {id: "search", label: "Search", icon: Search, path: "/search"},
        {id: "create", label: "", icon: Plus, path: "/buatgig", isCenter: true},
        {id: "chat", label: "Chat", icon: MessageSquare, path: "/chats"},
        {id: "activity", label: "Aktifitas", icon: Zap, path: "/activity"},
    ];

    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-107.5 z-50 bg-[#151515] border-t border-neutral-80 px-4 py-4">
            <div className="flex items-center justify-around max-w-md mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    
                    if(item.isCenter){
                        return (
                            <button key={item.id} onClick={() => navigate(item.path)} className="bg-unguterang hover:bg-purple-500 text-white p-5 rounded-full -mt-18 border-4 border-[#151515] shadow-lg active:scale-90 transition-transform">
                                <Icon size={22} />
                            </button>
                        );
                    }
                    return (
                        <button key={item.id} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${isActive ? "text-unguterang font-bold " : "text-gray-400 hover:text-gray-200"}`}>
                            <Icon size={24} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}