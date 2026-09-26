import { useState } from "react";
import { X, Save } from "lucide-react";
import TanggalGig from "../gig/post/TanggalGig";

export default function EditGigModal({ gig, onClose, onRefresh }) {
    const [title, setTitle] = useState(gig.title || "");
    const [description, setDescription] = useState(gig.description || "");
    const [budget, setBudget] = useState(gig.budget || "");
    const [deadline, setDeadline] = useState(gig.deadline ? gig.deadline.substring(0, 10) : "");
    const [urgency, setUrgency] = useState(gig.urgency || "santai");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // SIMPAN PERUBAHAN GIG
    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            const res = await fetch(`/api/gigs/${gig.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    title,
                    description,
                    budget: Number(budget),
                    deadline: deadline || null,
                    urgency,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                if (onRefresh) onRefresh();
                onClose();
            } else {
                setErrorMsg(data.message || "Gagal memperbarui Gig.");
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
                    <h2 className="text-lg font-black">Edit Gig</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-gray-800 text-gray-400 active:scale-95 transition-transform"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* FORM EDIT GIG */}
                <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4">
                    {errorMsg && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                            {errorMsg}
                        </div>
                    )}

                    {/* JUDUL GIG */}
                    <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase">Judul</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-3.5 rounded-2xl bg-[#141416] border border-gray-800 text-sm text-white focus:border-ungu outline-none"
                        />
                    </div>

                    {/* BUDGET GIG */}
                    <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase">Budget (Rp)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            className="w-full p-3.5 rounded-2xl bg-[#141416] border border-gray-800 text-sm text-white focus:border-ungu outline-none"
                        />
                    </div>

                    {/* TINGKAT URGENSI */}
                    <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase">Urgensi</label>
                        <select
                            value={urgency}
                            onChange={(e) => setUrgency(e.target.value)}
                            className="w-full p-3.5 rounded-2xl bg-[#141416] border border-gray-800 text-sm text-white focus:border-ungu outline-none"
                        >
                            <option value="santai">Santai</option>
                            <option value="segera">Segera</option>
                            <option value="mendesak">Mendesak</option>
                        </select>
                    </div>

                    {/* TARGET DEADLINE (STYLE SAMA DENGAN POST GIG) */}
                    <TanggalGig
                        value={deadline}
                        onChange={(val) => setDeadline(val)}
                    />

                    {/* DESKRIPSI */}
                    <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase">Deskripsi Pekerjaan</label>
                        <textarea
                            rows={4}
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-3.5 rounded-2xl bg-[#141416] border border-gray-800 text-sm text-white focus:border-ungu outline-none resize-none"
                        />
                    </div>

                    {/* TOMBOL SIMPAN */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-2xl font-bold bg-ungu text-white active:bg-unguterang active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        <Save size={18} />
                        {loading ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </form>
            </div>
        </div>
    );
}
