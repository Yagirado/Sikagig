import { Users, User, Plus, Minus, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function ModeGig({ value, maxWorkersValue, onChange }) {
    const [internalMode, setInternalMode] = useState(value || "sendiri");
    const [internalMaxWorkers, setInternalMaxWorkers] = useState(maxWorkersValue ?? "");

    const mode = value !== undefined ? value : internalMode;
    const maxWorkers = maxWorkersValue !== undefined ? maxWorkersValue : internalMaxWorkers;

    const numWorkers = maxWorkers === "" ? null : Number(maxWorkers);
    const isInvalid = mode === "barengan" && (numWorkers === null || isNaN(numWorkers) || numWorkers <= 1);

    const handleModeChange = (newMode) => {
        if (onChange) {
            onChange({ mode: newMode, max_workers: newMode === "barengan" ? maxWorkers : 1 });
        } else {
            setInternalMode(newMode);
        }
    };

    const handleMaxWorkersChange = (val) => {
        if (onChange) {
            onChange({ mode, max_workers: val });
        } else {
            setInternalMaxWorkers(val);
        }
    };

    const handleStep = (step) => {
        const current = numWorkers === null || isNaN(numWorkers) ? 2 : numWorkers;
        const nextVal = Math.min(50, Math.max(1, current + step));
        handleMaxWorkersChange(nextVal);
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Mode Gig & Kuota Pekerja</label>
            
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="max_workers" value={mode === "barengan" ? (maxWorkers ?? "") : 1} />

            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => handleModeChange("sendiri")}
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
                    onClick={() => handleModeChange("barengan")}
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

            {mode === "sendiri" ? (
                <p className="text-[11px] text-gray-500">
                    ⚡ Gig ini hanya butuh <strong className="text-gray-400">1 pekerja</strong> jagoan.
                </p>
            ) : (
                <div className="mt-1 p-3.5 bg-[#16161a] border border-gray-800/80 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold text-gray-200">Maksimal Orang / Kuota Pekerja</p>
                            <p className="text-[11px] text-gray-400">Batas jumlah pelamar yang bisa kamu terima</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#1f1f23] border border-gray-700/60 rounded-xl p-1">
                            <button
                                type="button"
                                onClick={() => handleStep(-1)}
                                disabled={numWorkers !== null && numWorkers <= 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 text-gray-300 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition-all"
                            >
                                <Minus size={14} />
                            </button>
                            <input
                                type="number"
                                min="2"
                                max="50"
                                placeholder="Min. 2"
                                value={maxWorkers}
                                onChange={(e) => handleMaxWorkersChange(e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-14 text-center bg-transparent text-sm font-black text-white focus:text-unguterang outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                                type="button"
                                onClick={() => handleStep(1)}
                                disabled={numWorkers !== null && numWorkers >= 50}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 text-gray-300 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition-all"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                    {/* PERINGATAN JIKA KURANG DARI ATAU SAMA DENGAN 1 ATAU KOSONG */}
                    {isInvalid ? (
                        <div className="p-2.5 bg-red-500/15 border border-red-500/30 rounded-xl flex items-start gap-2 text-red-400 text-xs">
                            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Kuota tidak boleh kurang dari atau sama dengan 1!</p>
                                <p className="text-[11px] text-red-300/80 mt-0.5">
                                    Mode Barengan membutuhkan minimal <strong>2 orang pekerja</strong>. Jika hanya 1 orang, silakan ganti ke <strong>Mode Sendiri</strong>.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[10px] text-gray-500">
                            👥 Kamu bisa menerima hingga <span className="text-unguterang font-bold">{maxWorkers} orang pekerja</span> untuk kolaborasi di Gig ini.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
