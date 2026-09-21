import { ArrowLeft, Briefcase, Shield } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { createGig } from "../../../lib/api";

import InfoCard from "./InfoCard";
import JudulGig from "./JudulGig";
import DeskripsiGig from "./DeskripsiGig";
import KategoriGig from "./KategoriGig";
import UrgensiGig from "./UrgensiGig";
import BudgetGig from "./BudgetGig";
import FotoGig from "./FotoGig";
import PersetujuanGig from "./PersetujuanGig";

export default function PostGigForm() {
    const navigate = useNavigate();
    const [agreed, setAgreed] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        
        if (!agreed) {
            setErrorMsg("Kamu harus setuju dengan aturan mainnya!");
            return;
        }

        setIsLoading(true);
        const form = e.target;
        const formData = new FormData(form);

        // Jika foto kosong, kita nggak usah kirim array kosong (biar nggak error validasi di Laravel)
        if (formData.getAll("photos").length === 1 && formData.get("photos").name === "") {
            formData.delete("photos");
        }

        try {
            await createGig(formData);
            navigate("/dashboard");
        } catch (error) {
            setErrorMsg(error instanceof TypeError ? "Terjadi kesalahan jaringan." : error.message || "Gagal membuat Gig.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mobile-container text-white bg-[#121212] min-h-screen pb-20">
            
            <div className="flex items-center gap-4 px-6 py-4 -mx-6 -mt-6 sticky top-0 bg-[#121212] z-10 border-b border-gray-800">
                <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-gray-800 rounded-full">
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
                <BudgetGig />
                <FotoGig />
                
                <PersetujuanGig agreed={agreed} setAgreed={setAgreed} />

                {errorMsg && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm font-bold text-center">
                        {errorMsg}
                    </div>
                )}
                
                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full font-bold py-4 rounded-2xl mt-4 transition-colors bg-ungu text-white hover:bg-unguterang disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                    {isLoading ? "Memproses..." : "Gaskeun Posting! 🚀"}
                </button>

            </form>
        </div>
    );
}
