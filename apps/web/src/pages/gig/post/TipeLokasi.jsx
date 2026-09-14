import { MapPin, Wifi } from "lucide-react";
import { useState } from "react";

export default function TipeLokasi() {
    const [locationType, setLocationType] = useState("Di Lokasi");

    return (
        <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Tipe Lokasi</label>
            <div className="grid grid-cols-2 gap-3">
                <input type="hidden" name="tipe_lokasi" value={locationType} />
                
                <button 
                    type="button"
                    onClick={() => setLocationType("Di Lokasi")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border transition-colors ${
                        locationType === "Di Lokasi"
                        ? 'bg-ungu/10 text-unguterang border-ungu/30'
                        : 'bg-[#1a1a1a] text-gray-400 border-gray-800'
                    }`}
                >
                    <MapPin size={16} />
                    <span className="text-sm font-medium">Di Lokasi</span>
                </button>
                <button 
                    type="button"
                    onClick={() => setLocationType("Remote")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border transition-colors ${
                        locationType === "Remote"
                        ? 'bg-ungu/10 text-unguterang border-ungu/30'
                        : 'bg-[#1a1a1a] text-gray-400 border-gray-800'
                    }`}
                >
                    <Wifi size={16} />
                    <span className="text-sm font-medium">Remote</span>
                </button>
            </div>
        </div>
    );
}
