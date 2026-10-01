import { useState } from "react";
import { X, Save } from "lucide-react";
import { getCsrfToken } from "../../lib/api";

export default function UpdateProgressModal({ proposal, onClose, onRefresh }) {
    const [progress, setProgress] = useState(proposal?.progress ?? 0);
    const [progressNotes, setProgressNotes] = useState(proposal?.progress_notes || "");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // PRESET PERSENTASE
    const presets = [0, 25, 50, 75, 100];

    // SIMPAN PERUBAHAN PROGRES
    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch(`/api/proposals/${proposal.id}/progress`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                credentials: "include",
                body: JSON.stringify({
                    progress: Number(progress),
                    progress_notes: progressNotes || null,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                if (onRefresh) onRefresh();
                onClose();
            } else {
                setErrorMsg(data.message || "Gagal memperbarui progres.");
            }
        } catch {
            setErrorMsg("Terjadi kesalahan jaringan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
            <div className="w-full max-w-md bg-[#18181b] border border-gray-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col text-white">
                
                {/* HEADER MODAL */}
                <div className="flex items-center justify-between p-5 border-b border-gray-800">
                    <div>
                        <h2 className="text-lg font-black">Update Progres Kerja</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Beri tahu klien sejauh mana progres pekerjaanmu</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-gray-800 text-gray-400 active:scale-95 transition-transform"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* FORM UPDATE PROGRES */}
                <form onSubmit={handleSave} className="p-5 space-y-5 overflow-y-auto">
                    {errorMsg && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                            {errorMsg}
                        </div>
                    )}

                    {/* JUDUL GIG */}
                    <div className="p-3.5 rounded-2xl bg-[#141416] border border-gray-800">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Gig yang Dikerjakan</span>
                        <p className="text-sm font-black text-white mt-0.5 line-clamp-1">{proposal.gig?.title || "Gig"}</p>
                    </div>

                    {/* SLIDER & INPUT PROGRES */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-gray-300">Persentase Progres</label>
                            <span className="text-base font-black text-unguterang">{progress}%</span>
                        </div>

                        {/* SLIDER */}
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={progress}
                            onChange={(e) => setProgress(Number(e.target.value))}
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-unguterang"
                        />

                        {/* PRESETS BUTTONS */}
                        <div className="flex items-center justify-between gap-1.5 mt-3">
                            {presets.map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setProgress(val)}
                                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                        progress === val
                                            ? "bg-ungu border-unguterang text-white shadow-md shadow-ungu/20"
                                            : "bg-[#141416] border-gray-800 text-gray-400 hover:text-gray-200"
                                    }`}
                                >
                                    {val}%
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CATATAN PROGRES */}
                    <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1.5">
                            Catatan / Deskripsi Progres (Opsional)
                        </label>
                        <textarea
                            rows={3}
                            value={progressNotes}
                            onChange={(e) => setProgressNotes(e.target.value)}
                            placeholder="Contoh: Sudah selesai 50%, sedang tahap revisi layout..."
                            className="w-full bg-[#141416] border border-gray-800 rounded-2xl p-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-unguterang transition-colors resize-none"
                            maxLength={500}
                        />
                        <p className="text-[10px] text-gray-500 text-right mt-1">
                            {progressNotes.length}/500 karakter
                        </p>
                    </div>

                    {/* TOMBOL SIMPAN */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-ungu active:bg-unguterang text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-ungu/25"
                        >
                            {loading ? (
                                <span>Menyimpan...</span>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>Simpan Progres</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
