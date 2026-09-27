import { Search, UserRound } from "lucide-react";
import BottomNavbar from "../../components/bottomnavbar";
import { useNavigate } from "react-router";

export default function Chats() {
    const navigate = useNavigate();

    return (
        <div className="mobile-container text-white min-h-screen pb-24 py-5!">
            <header className="sticky top-0 z-50 text-start ml-3 font-black mb-4">
                <h1 className="font-bold text-2xl ">
                    Chats
                </h1>
                <label className="flex w-full px-2 py-2 mt-2 rounded-full bg-dark">
                    <Search />
                    <input 
                        type="text"
                        
                    />
                </label>
            </header>

            <div className="flex flex-col items-center justify-center gap-4">
                <button
                    onClick={() => navigate('/chats/room')} 
                    className="flex items-center bg-dark w-full h-20 mt-2 rounded-3xl border border-gray-700 cursor-pointer"
                >
                    <div className="flex justify-center items-center h-11 w-11 rounded-full bg-unguterang ml-6">
                        <UserRound size={22} strokeWidth={3} className="shrink-0"/>
                    </div>

                    <div className="flex flex-col ml-4">
                        <span className="block max-w-50 truncate text-lg -mt-1">
                            Nugi ini bre buset kawan lama gua anjir
                        </span>
                        <span className="block max-w-50 truncate text-[12px] text-gray-400 ">
                            lu kemana aja cuy daoidaondaliduawndluawidnui
                        </span>
                    </div>
                    
                    <div className="flex flex-col ml-8">
                        <div className="pb-2 text-gray-400 text-xs ml-2">
                            16h lalu
                        </div>

                        <div className="ml-6 flex items-center justify-center bg-unguterang rounded-full h-4 w-4">
                            
                            <span className="text-[9px]">2</span>
                        </div>
                    </div>
                </button>
            </div>

            <BottomNavbar />
        </div>
    );
}
