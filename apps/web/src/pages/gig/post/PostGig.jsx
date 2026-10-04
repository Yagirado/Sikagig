import { AlertCircle, ArrowLeft, Briefcase, Shield } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { createGig } from "../../../lib/api";

import InfoCard from "./InfoCard";
import JudulGig from "./JudulGig";
import DeskripsiGig from "./DeskripsiGig";
import KategoriGig from "./KategoriGig";
import UrgensiGig from "./UrgensiGig";
import BudgetGig from "./BudgetGig";
import ModeGig from "./ModeGig";
import TanggalGig from "./TanggalGig";
import FotoGig from "./FotoGig";
import PersetujuanGig from "./PersetujuanGig";

export default function PostGigForm() {
    const navigate = useNavigate();
    const [agreed, setAgreed] = useState(false);
    const [photoFiles, setPhotoFiles] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors([]);
        
        if (!agreed) {
            setErrors(["Kamu harus setuju dengan aturan mainnya!"]);
            return;
        }

        const form = e.target;
        const formData = new FormData(form);

        const mode = formData.get("mode");
        const maxWorkers = formData.get("max_workers");
        if (mode === "barengan" && (!maxWorkers || Number(maxWorkers) <= 1)) {
            setErrors(["Untuk Mode Barengan, batas kuota pekerja minimal 2 orang!"]);
            return;
        }

        setIsLoading(true);

        // Hapus field photos dari native input (kalau ada), kita append manual dari state
        formData.delete("photos[]");

        // Append file dari state (File objects sesungguhnya)
        photoFiles.forEach((file) => {
            formData.append("photos[]", file);
        });

        try {
            await createGig(formData);
            navigate("/dashboard");
        } catch (error) {
            if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
                setErrors(error.errors);
            } else {
                setErrors([error instanceof TypeError ? "Terjadi kesalahan jaringan." : error.message || "Gagal membuat Gig."]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mobile-container pt-0! text-white bg-[#121212] min-h-screen pb-20">
            
            <div className="flex items-center gap-4 px-6 py-4 -mx-6 sticky top-0 bg-[#121212] z-10 border-b border-gray-800">
                <button type="button" onClick={() => navigate(-1)} className="p-2 active:bg-gray-800 active:scale-95 transition-all rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">Buat Gig Baru</h1>
            </div>

            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-6">
                
                <InfoCard 
                    icon={Briefcase}
                    title="Gig = Cari orang buat bantuin lu"
                    description="Tulis kerjaan yang butuh dikerjain orang lain. Kalau lu yang mau jualan skill/jasa, balik ke halaman awal terus pilih menu Nawarin Jasa."
                    iconBgClass="bg-ungu/10 border-ungu/20"
                    iconColorClass="text-unguterang"
                />

                <JudulGig />
                <DeskripsiGig />
                
                <InfoCard 
                    icon={Shield}
                    title="Jaga Transaksi Tetap Aman"
                    description="Hindari ngasih kontak pribadi kayak nomor WA. Usahain ngobrol tetep lewat chat Sikagig biar aman, ada bukti kerja, dan gampang dibantu admin."
                    iconBgClass="bg-red-500/10 border-red-500/20"
                    iconColorClass="text-red-400"
                />

                <KategoriGig />
                <UrgensiGig />
                <ModeGig />
                <BudgetGig />
                <TanggalGig />
                <FotoGig onFilesChange={setPhotoFiles} />
                
                <PersetujuanGig agreed={agreed} setAgreed={setAgreed} />

                {errors.length > 0 && (
                    <div className="bg-red-500/15 border border-red-500/40 text-red-300 p-4 rounded-2xl text-left">
                        <div className="flex items-center gap-2 text-red-400 font-bold mb-2 text-sm">
                            <AlertCircle size={18} className="shrink-0" />
                            <span>Mohon lengkapi bagian berikut:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            {errors.map((err, idx) => (
                                <li key={idx} className="leading-relaxed">{err}</li>
                            ))}
                        </ul>
                    </div>
                )}
                
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full font-bold py-4 rounded-2xl mt-4 transition-all bg-ungu text-white active:bg-unguterang active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                    {isLoading ? "Memproses..." : "Gaskeun Posting! 🚀"}
                </button>

            </form>
        </div>
    );
}
