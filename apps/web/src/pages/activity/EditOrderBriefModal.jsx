import { useState } from "react";
import { X, Save } from "lucide-react";

export default function EditOrderBriefModal({ order, onClose, onRefresh }) {
    const [briefNotes, setBriefNotes] = useState(order.brief_notes || "");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // SIMPAN PERUBAHAN BRIEF
    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            const res = await fetch(`/api/orders/${order.id}/brief`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    brief_notes: briefNotes,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                if (onRefresh) onRefresh();
                onClose();
            } else {
                setErrorMsg(data.message || "Gagal memperbarui catatan.");
            }
        } catch {
            setErrorMsg("Terjadi kesalahan jaringan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
            <div className="w-full max-w-md bg-[#18181b] border border-gray-800 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col text-white">
                
                {/* HEADER MODAL */}
                <div className="flex items-center justify-between p-5 border-b border-gray-800">
                    <h2 className="text-lg font-black">Ubah Catatan Brief</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-gray-800 text-gray-400 active:scale-95 transition-transform"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* FORM UBAH BRIEF */}
                <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4">
                    {errorMsg && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                            {errorMsg}
                        </div>
                    )}

                    {/* DETAIL JASA */}
                    <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Pesanan</span>
                        <p className="text-sm font-bold text-gray-200">{order.jasa?.name || "Jasa"}</p>
                        <p className="text-xs text-unguterang mt-0.5">{order.package_name}</p>
                    </div>

                    {/* CATATAN BRIEF */}
                    <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase">Catatan / Kebutuhan untuk Penjual</label>
                        <textarea
                            rows={5}
                            required
                            value={briefNotes}
                            onChange={(e) => setBriefNotes(e.target.value)}
                            placeholder="Tuliskan detail kebutuhan atau link referensi..."
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
                        {loading ? "Menyimpan..." : "Simpan Catatan"}
                    </button>
                </form>
            </div>
        </div>
    );
}
