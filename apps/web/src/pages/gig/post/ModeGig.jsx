import { Users, User } from "lucide-react";
import { useState } from "react";

export default function ModeGig() {
    const [mode, setMode] = useState("sendiri");

    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Mode Gig</label>
            
            
            <input type="hidden" name="mode" value={mode} />

            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => setMode("sendiri")}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border font-bold text-sm transition-all active:scale-95 ${
                        mode === "sendiri"
                            ? "bg-ungu/10 border-ungu text-unguterang"
                            : "bg-[#1a1a1a] border-gray-800 text-gray-400"
                    }`}
                >
                    <User size={16} />
                    Sendiri
                </button>

                <button
                    type="button"
                    onClick={() => setMode("barengan")}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border font-bold text-sm transition-all active:scale-95 ${
                        mode === "barengan"
                            ? "bg-ungu/10 border-ungu text-unguterang"
                            : "bg-[#1a1a1a] border-gray-800 text-gray-400"
                    }`}
                >
                    <Users size={16} />
                    Barengan
                </button>
            </div>

            {mode === "sendiri" && (
                <p className="text-[10px] text-gray-500">
                    ⚡ Gig ini dikerjain sama satu orang saja
                </p>
            )}
            {mode === "barengan" && (
                <p className="text-[10px] text-gray-500">
                    👥 Gig ini bisa dikerjain bareng banyak orang sekaligus
                </p>
            )}
        </div>
    );
}
