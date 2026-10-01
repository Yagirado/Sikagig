import { useState } from "react";
import { X, Send, ArrowLeft, Tag } from "lucide-react";
import { useNavigate } from "react-router";
import { getCsrfToken } from "../../../lib/api";

export default function AjukanProposalModal({ gig, onClose }) {
    const navigate = useNavigate();
    const [bidAmount, setBidAmount] = useState("");
    const [coverLetter, setCoverLetter] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [success, setSuccess] = useState(false);

    // HITUNG TERIMA BERSIH SETELAH POTONGAN KOMISI PLATFORM 15%
    const parsedBid = Number(bidAmount) || 0;
    const netAmount = parsedBid > 0 ? Math.round(parsedBid * 0.85) : 0;

    // KIRIM PENAWARAN KE BACKEND
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch(`/api/gigs/${gig.id}/proposals`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
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
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 rounded-full text-gray-400 active:scale-95 transition-transform"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-lg font-black">Ajukan Penawaran</h2>
                    </div>
                    <button
                        type="button"
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

                            {/* INFO GIG DAN BUDGET */}
                            <div className="bg-[#141416] p-4 rounded-2xl border border-gray-800 space-y-2.5">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">
                                        Kamu Mengajukan Untuk
                                    </span>
                                    <p className="text-sm font-bold text-white line-clamp-1 mt-0.5">
                                        {gig.title || "-"}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between pt-2.5 border-t border-gray-800/80">
                                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                                        <Tag size={13} className="text-gray-400" /> Budget Juragan
                                    </span>
                                    <span className="text-sm font-bold text-unguterang">
                                        Rp {Number(gig.budget || 0).toLocaleString("id-ID")}
                                    </span>
                                </div>
                            </div>

                            {/* TAWARAN HARGA */}
                            <div>
                                <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase tracking-wide">
                                    Harga Penawaran (RP)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                                        Rp
                                    </span>
                                    <input
                                        type="number"
                                        required
                                        min="1000"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#141416] border border-gray-800 text-sm font-bold text-white focus:border-ungu outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            {/* ESTIMASI DITERIMA BERSIH SETELAH KOMISI 15% */}
                            {parsedBid > 0 && (
                                <div className="bg-[#19191d] p-4 rounded-2xl border border-gray-800 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-white">Kamu terima bersih</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">Sudah dipotong komisi platform 15%</p>
                                    </div>
                                    <p className="text-base font-black text-unguterang">
                                        Rp {netAmount.toLocaleString("id-ID")}
                                    </p>
                                </div>
                            )}

                            {/* COVER LETTER */}
                            <div>
                                <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase tracking-wide">
                                    Pesan ke Juragan
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    placeholder="Ceritakan keahlianmu atau alasan kenapa juragan harus memilihmu..."
                                    className="w-full p-3.5 rounded-2xl bg-[#141416] border border-gray-800 text-sm text-white focus:border-ungu outline-none resize-none transition-colors"
                                />
                            </div>

                            {/* TOMBOL SUBMIT */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-2xl font-bold bg-ungu hover:bg-unguterang text-white active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_4px_16px_rgba(149,100,221,0.3)]"
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
