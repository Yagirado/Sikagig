import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router";

export default function KonfirmasiOrderModal({ jasa, paket, price, onClose }) {
    const navigate = useNavigate();
    const [briefNotes, setBriefNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [success, setSuccess] = useState(false);

    // BUAT ORDER BARU
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            const res = await fetch(`/api/jasas/${jasa.id}/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    package_name: paket?.nama || "Paket Standar",
                    price: Number(price),
                    brief_notes: briefNotes,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    navigate("/activity");
                }, 1200);
            } else {
                setErrorMsg(data.message || "Gagal memesan jasa.");
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
                    <div>
                        <h2 className="text-lg font-black">Konfirmasi Pemesanan</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Periksa rincian sebelum menyelesaikan order</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-gray-800 text-gray-400 active:scale-95 transition-transform"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* FORM KONFIRMASI */}
                <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
                    {success ? (
                        <div className="py-8 text-center space-y-2">
                            <span className="text-4xl block">🎉</span>
                            <h3 className="text-base font-bold text-green-400">Pesanan Berhasil Dibuat!</h3>
                            <p className="text-xs text-gray-400">Mengalihkan ke halaman aktivitas...</p>
                        </div>
                    ) : (
                        <>
                            {errorMsg && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                                    {errorMsg}
                                </div>
                            )}

                            {/* RINGKASAN JASA & HARGA */}
                            <div className="bg-[#141416] p-4 rounded-2xl border border-gray-800 space-y-2">
                                <span className="text-[10px] text-gray-400 font-bold uppercase block">Layanan Jasa</span>
                                <h3 className="text-sm font-bold text-white">{jasa.name}</h3>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-800/80">
                                    <span className="text-xs text-gray-300 bg-[#26242c] px-2.5 py-1 rounded-lg">
                                        {paket?.nama || "Paket Standar"}
                                    </span>
                                    <span className="text-base font-black text-unguterang">
                                        Rp {Number(price).toLocaleString("id-ID")}
                                    </span>
                                </div>
                            </div>

                            {/* CATATAN BRIEF UNTUK PENJUAL */}
                            <div>
                                <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase">
                                    Catatan / Brief Kebutuhan (Opsional)
                                </label>
                                <textarea
                                    rows={4}
                                    value={briefNotes}
                                    onChange={(e) => setBriefNotes(e.target.value)}
                                    placeholder="Jelaskan kebutuhanmu atau berikan instruksi khusus untuk jagoan..."
                                    className="w-full p-3.5 rounded-2xl bg-[#141416] border border-gray-800 text-sm text-white focus:border-ungu outline-none resize-none"
                                />
                            </div>

                            {/* TOMBOL BAYAR / PESAN */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-2xl font-bold bg-ungu text-white active:bg-unguterang active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_4px_16px_rgba(149,100,221,0.3)]"
                            >
                                <CheckCircle size={18} />
                                {loading ? "Memproses..." : `Pesan Sekarang • Rp ${Number(price).toLocaleString("id-ID")}`}
                            </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}
