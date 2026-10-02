import { useState, useEffect } from "react";
import { X, Upload, CheckCircle2, FileText, Link2, AlertCircle, ArrowLeft, UserCheck } from "lucide-react";
import { getCsrfToken } from "../../lib/api";

export default function SubmitProofModal({ item, isJasa = false, onClose, onRefresh }) {
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        let ignore = false;
        async function fetchMe() {
            try {
                const res = await fetch("/api/auth/me", {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (!ignore && data.user) {
                        setCurrentUser(data.user);
                    }
                }
            } catch {
                // Ignore
            }
        }
        fetchMe();
        return () => {
            ignore = true;
        };
    }, []);

    const studentName =
        currentUser?.fullName ||
        item?.user?.fullName ||
        item?.student_name ||
        "Mahasiswa";

    const studentNim =
        currentUser?.NIM ||
        currentUser?.nim ||
        item?.user?.NIM ||
        item?.user?.nim ||
        item?.student_nim ||
        "-";

    const [notes, setNotes] = useState(item?.proof_notes || "");
    const [link, setLink] = useState(item?.proof_link || "");
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(item?.proof_file ? `/storage/${item.proof_file}` : null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            if (selected.type.startsWith("image/")) {
                setFilePreview(URL.createObjectURL(selected));
            } else {
                setFilePreview(null);
            }
        }
    };

    const isFileOrLinkFilled = !!file || !!filePreview || !!link.trim();
    const canSubmit = isFileOrLinkFilled;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) {
            setErrorMsg("Harap lampirkan file bukti pengerjaan atau tautan link tugas.");
            return;
        }

        setLoading(true);
        setErrorMsg("");

        try {
            const csrfToken = await getCsrfToken();
            const formData = new FormData();
            formData.append("student_name", studentName);
            formData.append("student_nim", studentNim);
            formData.append("proof_notes", notes);
            if (link) formData.append("proof_link", link);
            if (file) formData.append("proof_file", file);

            const endpoint = isJasa
                ? `/api/orders/${item.id}/submit-proof`
                : `/api/proposals/${item.id}/submit-proof`;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                credentials: "include",
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                if (onRefresh) onRefresh();
                onClose();
            } else {
                setErrorMsg(data.message || "Gagal mengirim bukti tugas.");
            }
        } catch {
            setErrorMsg("Terjadi kesalahan jaringan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4">
            <div className="w-full max-w-md bg-[#121215] border border-gray-800 rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col text-white shadow-2xl overflow-hidden">
                
                {/* HEADER MODAL */}
                <div className="flex items-center justify-between p-4 px-5 border-b border-gray-800/80 bg-[#16161a] shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-full bg-gray-800/80 text-gray-400 hover:text-white active:scale-95 transition-all"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h2 className="text-base font-black">Formulir Pengumpulan Pekerjaan</h2>
                            <p className="text-[11px] text-gray-400">Lengkapi form sebelum mengirim bukti.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full bg-gray-800/80 text-gray-400 hover:text-white active:scale-95 transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* FORM CONTENT */}
                <form onSubmit={handleSubmit} className="p-4 px-5 overflow-y-auto flex-1 space-y-4 hide-scrollbar overscroll-contain">
                    {errorMsg && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* IDENTITAS MAHASISWA  */}
                    <div className="p-4 rounded-2xl bg-[#18181e] border border-gray-800/80 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white flex items-center gap-1.5">
                                <UserCheck size={14} className="text-unguterang" /> Identitas
                            </span>
                            <span className="text-[10px] font-medium text-gray-400 bg-white/5 border border-gray-800 px-2 py-0.5 rounded-full">
                                Otomatis Terisi
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="bg-[#121215] border border-gray-800 p-2.5 rounded-xl">
                                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Nama Mahasiswa</span>
                                <span className="text-xs font-black text-white block mt-0.5 truncate">{studentName}</span>
                            </div>
                            <div className="bg-[#121215] border border-gray-800 p-2.5 rounded-xl">
                                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">NPM / NIM</span>
                                <span className="text-xs font-black text-unguterang block mt-0.5 truncate">{studentNim}</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-500 italic">
                            *Identitas otomatis disesuaikan dengan akunmu sebagai validasi kepada pemilik Gig.
                        </p>
                    </div>

                    {/* PERTANYAAN 1: BUKTI PENGERJAAN (FILE / GAMBAR / LINK) */}
                    <div className="p-4 rounded-2xl bg-[#18181e] border border-gray-800/80 space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-ungu/30 text-unguterang text-xs font-black flex items-center justify-center">
                                1
                            </span>
                            <label className="text-xs font-black text-white">
                                Bukti Pengerjaan Tugas
                            </label>
                            <span className="text-[10px] font-bold text-red-400 ml-auto">
                                * Wajib diisi
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                            Upload screenshot / file hasil pengerjaan atau cantumkan tautan Google Drive / Figma / GitHub.
                        </p>

                        {/* UPLOAD FILE BOX */}
                        <label className="border border-dashed border-gray-700 hover:border-unguterang bg-[#121215] rounded-xl p-3.5 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                            <input
                                type="file"
                                accept="image/*,.pdf,.zip,.rar,.doc,.docx"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            {filePreview ? (
                                <div className="w-full space-y-2 text-center">
                                    <img
                                        src={filePreview}
                                        alt="Preview Bukti"
                                        className="max-h-36 rounded-lg mx-auto object-cover border border-gray-800"
                                    />
                                    <span className="text-[11px] text-unguterang font-bold block">
                                        Klik untuk ganti file
                                    </span>
                                </div>
                            ) : file ? (
                                <div className="flex items-center gap-2 text-unguterang text-xs font-bold">
                                    <FileText size={18} />
                                    <span>{file.name}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1.5 py-2">
                                    <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 group-hover:text-unguterang group-hover:bg-ungu/20 transition-colors">
                                        <Upload size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-300">Pilih File Bukti</span>
                                    <span className="text-[10px] text-gray-500">Gambar, Screenshot, PDF, atau ZIP (Maks. 10MB)</span>
                                </div>
                            )}
                        </label>

                        {/* ATAU LINK TUGAS */}
                        <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                <Link2 size={12} /> Atau Masukkan Link Tugas (Google Drive / GitHub / URL):
                            </span>
                            <input
                                type="url"
                                placeholder="https://drive.google.com/..."
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                className="w-full bg-[#121215] border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-unguterang transition-colors"
                            />
                        </div>
                    </div>

                    {/* PERTANYAAN 2: CATATAN BUKTI PEKERJAAN */}
                    <div className="p-4 rounded-2xl bg-[#18181e] border border-gray-800/80 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-ungu/30 text-unguterang text-xs font-black flex items-center justify-center">
                                2
                            </span>
                            <label className="text-xs font-black text-white">
                                Catatan Bukti Pengerjaan
                            </label>
                            <span className="text-[10px] text-gray-500 ml-auto">
                                Opsional
                            </span>
                        </div>
                        <textarea
                            rows={3}
                            placeholder="Contoh: Tugas sudah selesai dikerjakan sesuai brief, file PDF terlampir dan sudah diverifikasi."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-[#121215] border border-gray-800 rounded-xl p-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-unguterang transition-colors resize-none"
                        />
                    </div>
                </form>

                {/* FOOTER BUTTON */}
                <div className="p-4 px-5 pb-6 sm:pb-4 border-t border-gray-800/80 bg-[#16161a] space-y-2 shrink-0">
                    {!isFileOrLinkFilled && (
                        <p className="text-[11px] text-amber-400 text-center flex items-center justify-center gap-1">
                            <AlertCircle size={13} />
                            <span>Silakan upload file bukti atau masukkan link tugas</span>
                        </p>
                    )}

                    <button
                        type="button"
                        disabled={!canSubmit || loading}
                        onClick={handleSubmit}
                        className="w-full py-3 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-ungu to-unguterang hover:opacity-95 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-ungu/25 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span>Mengirim Form...</span>
                        ) : (
                            <>
                                <CheckCircle2 size={16} />
                                <span>Kirim Form</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
