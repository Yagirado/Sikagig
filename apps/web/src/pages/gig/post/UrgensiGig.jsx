import { useState } from "react";
import { Coffee, Clock, AlertTriangle } from "lucide-react";

export default function UrgensiGig() {
    const [selectedUrgency, setSelectedUrgency] = useState("");

    const urgencyLevels = [
        { 
            id: "santai", 
            label: "Santai", 
            desc: "Waktu pengerjaan fleksibel, tidak buru-buru",
            icon: Coffee,
            iconColor: "text-green-400",
            activeClass: "bg-green-500/10 border-green-500 text-green-300"
        },
        { 
            id: "segera", 
            label: "Segera", 
            desc: "Dibutuhkan dalam 1-3 hari ke depan",
            icon: Clock,
            iconColor: "text-yellow-400",
            activeClass: "bg-yellow-500/10 border-yellow-500 text-yellow-300"
        },
        { 
            id: "mendesak", 
            label: "Mendesak", 
            desc: "Sangat butuh cepat / harus selesai hari ini",
            icon: AlertTriangle,
            iconColor: "text-red-400",
            activeClass: "bg-red-500/10 border-red-500 text-red-300"
        }
    ];

    return (
        <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Tingkat Urgensi</label>
            <input type="hidden" name="urgency" value={selectedUrgency} />
            
            <div className="flex flex-col gap-2">
                {urgencyLevels.map((level) => {
                    const Icon = level.icon;
                    const isActive = selectedUrgency === level.id;
                    
                    return (
                        <button
                            key={level.id}
                            type="button"
                            onClick={() => setSelectedUrgency(level.id)}
                            className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                                isActive 
                                ? level.activeClass 
                                : 'bg-[#1a1a1a] border-gray-800 hover:border-gray-600 text-gray-300'
                            }`}
                        >
                            <div className={`p-2 rounded-lg ${isActive ? 'bg-transparent' : 'bg-[#2a2a2a]'}`}>
                                <Icon size={20} className={level.iconColor} />
                            </div>
                            <div>
                                <div className={`font-bold ${isActive ? 'text-white' : 'text-gray-200'}`}>
                                    {level.label}
                                </div>
                                <div className={`text-xs mt-0.5 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                                    {level.desc}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
