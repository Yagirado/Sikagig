import { useState } from "react";
import { X, Save } from "lucide-react";

export default function EditJasaModal({ jasa, onClose, onRefresh }) {
    const [name, setName] = useState(jasa.name || "");
    const [category, setCategory] = useState(jasa.category || "");
    const [price, setPrice] = useState(jasa.price || "");
    const [description, setDescription] = useState(jasa.description || "");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // SIMPAN PERUBAHAN JASA
    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            const res = await fetch(`/api/jasas/${jasa.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    name,
                    category,
                    price: Number(price),
                    description,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                if (onRefresh) onRefresh();
                onClose();
            } else {
                setErrorMsg(data.message || "Gagal memperbarui jasa.");
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
                    <h2 className="text-lg font-black">Edit Jasa</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-gray-800 text-gray-400 active:scale-95 transition-transform"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* FORM EDIT JASA */}
                <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4">
                    {errorMsg && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                            {errorMsg}
                        </div>
                    )}

                    {/* NAMA JASA */}
                    <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase">Nama Jasa</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3.5 rounded-2xl bg-[#141416] border border-gray-800 text-sm text-white focus:border-ungu outline-none"
                        />
                    </div>

                    {/* KATEGORI */}
                    <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase">Kategori</label>
                        <input
                            type="text"
                            required
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full p-3.5 rounded-2xl bg-[#141416] border border-gray-800 text-sm text-white focus:border-ungu outline-none"
                        />
                    </div>

                    {/* HARGA MULAI */}
                    <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase">Harga Mulai Dari (Rp)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full p-3.5 rounded-2xl bg-[#141416] border border-gray-800 text-sm text-white focus:border-ungu outline-none"
                        />
                    </div>

                    {/* DESKRIPSI */}
                    <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase">Deskripsi Layanan</label>
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
