import { Info, User, Users } from "lucide-react";
import { useState } from "react";

export default function ModeGig() {
    const [gigMode, setGigMode] = useState("Satu Jagoan");

    return (
        <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Mode Gig</label>
            <div className="grid grid-cols-2 gap-3">
                <input type="hidden" name="mode_gig" value={gigMode} />
                
                <button 
                    type="button"
                    onClick={() => setGigMode("Satu Jagoan")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border transition-colors ${
                        gigMode === "Satu Jagoan"
                        ? 'bg-ungu/10 text-unguterang border-ungu/30'
                        : 'bg-[#1a1a1a] text-gray-400 border-gray-800'
                    }`}
                >
                    <User size={16} />
                    <span className="text-sm font-medium">Pribadi</span>
                </button>
                <button 
                    type="button"
                    onClick={() => setGigMode("Banyak Jagoan")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border transition-colors ${
                        gigMode === "Banyak Jagoan"
                        ? 'bg-ungu/10 text-unguterang border-ungu/30'
                        : 'bg-[#1a1a1a] text-gray-400 border-gray-800'
                    }`}
                >
                    <Users size={16} />
                    <span className="text-sm font-medium">Banyak Orang</span>
                </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                <Info size={14} />
                <span>Minimum budget single gig Rp 15.000</span>
            </div>
        </div>
    );
}
