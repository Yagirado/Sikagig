import { useState } from "react";

export default function JenisJasa() {
    const [jenis, setJenis] = useState("Online / Remote");

    return (
        <div className="flex flex-col gap-3 mt-4">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Jenis Jasa</label>
            <div className="grid grid-cols-2 gap-3">
                <input type="hidden" name="jenis_jasa" value={jenis} />
                
                <button 
                    type="button"
                    onClick={() => setJenis("Online / Remote")}
                    className={`flex items-center justify-center p-3 rounded-2xl transition-colors font-bold text-sm ${
                        jenis === "Online / Remote"
                        ? 'bg-ungu text-white'
                        : 'bg-[#1a1a1a] text-white active:bg-gray-800 active:scale-[0.98] transition-all border border-gray-800'
                    }`}
                >
                    Online / Remote
                </button>
                <button 
                    type="button"
                    onClick={() => setJenis("Offline / Datang")}
                    className={`flex items-center justify-center p-3 rounded-2xl transition-colors font-bold text-sm ${
                        jenis === "Offline / Datang"
                        ? 'bg-ungu text-white'
                        : 'bg-[#1a1a1a] text-white active:bg-gray-800 active:scale-[0.98] transition-all border border-gray-800'
                    }`}
                >
                    Offline / Datang
                </button>
            </div>
        </div>
    );
}
