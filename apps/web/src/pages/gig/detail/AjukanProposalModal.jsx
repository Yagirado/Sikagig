import { useState } from "react";
import { X, Send } from "lucide-react";
import { useNavigate } from "react-router";

export default function AjukanProposalModal({ gig, onClose }) {
    const navigate = useNavigate();
    const [bidAmount, setBidAmount] = useState(gig.budget ? String(Math.floor(gig.budget)) : "");
    const [coverLetter, setCoverLetter] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [success, setSuccess] = useState(false);

    // KIRIM PENAWARAN KE BACKEND
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            const res = await fetch(`/api/gigs/${gig.id}/proposals`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    bid_amount: Number(bidAmount),
                    cover_letter: coverLetter,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    navigate("/activity");
                }, 1200);
            } else {
                setErrorMsg(data.message || "Gagal mengirim penawaran.");
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
                        <h2 className="text-lg font-black">Ajukan Penawaran</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Tawarkan keahlianmu untuk Gig ini</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-gray-800 text-gray-400 active:scale-95 transition-transform"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* FORM INPUT PROPOSAL */}
                <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
                    {success ? (
                        <div className="py-8 text-center space-y-2">
                            <span className="text-4xl block">🎉</span>
                            <h3 className="text-base font-bold text-green-400">Penawaran Berhasil Dikirim!</h3>
                            <p className="text-xs text-gray-400">Mengalihkan ke halaman aktivitas...</p>
                        </div>
                    ) : (
                        <>
                            {errorMsg && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                                    {errorMsg}
                                </div>
                            )}

                            {/* INFO BUDGET REFERENSI */}
                            <div className="bg-[#141416] p-3.5 rounded-2xl border border-gray-800 flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-bold uppercase">Budget Klien:</span>
                                <span className="text-sm font-black text-gray-200">
                                    Rp {Number(gig.budget).toLocaleString("id-ID")}
                                </span>
                            </div>

                            {/* TAWARAN HARGA */}
                            <div>
                                <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase">
                                    Nominal Penawaranmu (Rp)
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1000"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    placeholder="Contoh: 100000"
                                    className="w-full p-3.5 rounded-2xl bg-[#141416] border border-gray-800 text-sm text-white focus:border-ungu outline-none"
                                />
                                <span className="text-[10px] text-gray-500 mt-1 block">
                                    Bisa tawarkan sama dengan budget, atau lebih murah/mahal sesuai kesepakatan.
                                </span>
                            </div>

                            {/* COVER LETTER */}
                            <div>
                                <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase">
                                    Pesan / Kenapa Memilihmu
                                </label>
                                <textarea
                                    rows={4}
                                    required
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    placeholder="Ceritakan pengalamanmu atau cara kamu menyelesaikan pekerjaan ini..."
                                    className="w-full p-3.5 rounded-2xl bg-[#141416] border border-gray-800 text-sm text-white focus:border-ungu outline-none resize-none"
                                />
                            </div>

                            {/* TOMBOL SUBMIT */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-2xl font-bold bg-ungu text-white active:bg-unguterang active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_4px_16px_rgba(149,100,221,0.3)]"
                            >
                                <Send size={16} />
                                {loading ? "Mengirim..." : "Kirim Penawaran 🚀"}
                            </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}
