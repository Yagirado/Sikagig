import { useState } from "react";

export default function LokasiKota() {
    const [kota, setKota] = useState("Deket Unsika");

    const opsiKota = ["Deket Unsika", "Karawang Kota", "Luar Karawang"];

    return (
        <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Lokasi / Kota</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="hidden" name="kota" value={kota} />
                
                {opsiKota.map((opt) => (
                    <button 
                        type="button"
                        key={opt}
                        onClick={() => setKota(opt)}
                        className={`flex items-center justify-center p-3 rounded-2xl border transition-colors ${
                            kota === opt
                            ? 'bg-ungu/10 text-unguterang border-ungu/30'
                            : 'bg-[#1a1a1a] text-gray-400 border-gray-800'
                        }`}
                    >
                        <span className="text-sm font-medium">{opt}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
