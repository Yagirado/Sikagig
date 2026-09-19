import { useLocation, useNavigate } from "react-router";
import { Home, Search, Plus, MessageSquare, Zap } from "lucide-react";

export default function BottomNavbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        {id: "home", label: "Beranda", icon: Home, path: "/dashboard"},
        {id: "search", label: "Explore", icon: Search, path: "/explore"},
        {id: "create", label: "", icon: Plus, path: "/buatgig", isCenter: true},
        {id: "chat", label: "Chat", icon: MessageSquare, path: "/chats"},
        {id: "activity", label: "Aktifitas", icon: Zap, path: "/activity"},
    ];

    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-107.5 z-50 bg-[#151515] border-t border-gray-700">
            <div className="grid h-18 grid-cols-5 mb-3">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    if(item.isCenter){
                        return (
                            <button
                                key={item.id}
                                type="button"
                                aria-label="Buat gig"
                                onClick={() => navigate(item.path)}
                                className="
                                    group flex h-full w-full min-w-0 cursor-pointer items-center justify-center 
                                    focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-unguterang"
                                >
                                <span 
                                    className="
                                        flex size-16 shrink-0 -translate-y-6.5 items-center justify-center 
                                        rounded-full border-6 border-[#151515] bg-unguterang text-white 
                                        shadow-[0_3px_15px_-3px] shadow-unguterang
                                        transition-transform group-hover:bg-purple-500 group-active:scale-90"
                                >
                                    <Icon size={32} />
                                </span>
                            </button>
                        );
                    }
                    return (
                        <button
                            key={item.id}
                            type="button"
                            aria-current={isActive ? "page" : undefined}
                            onClick={() => navigate(item.path)}
                            className=
                                {`flex h-full w-full min-w-0 cursor-pointer 
                                flex-col items-center justify-center gap-1 text-[10.5px] font-semibold font-system-ui tracking-wide
                                transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white
                                ${isActive
                                    ? "text-unguterang font-bold "
                                    : "text-gray-400 hover:text-gray-200"}`}
                        >
                            <Icon size={24} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
