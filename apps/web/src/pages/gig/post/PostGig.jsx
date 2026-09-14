import { ArrowLeft, Briefcase, Shield } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";

import InfoCard from "./InfoCard";
import JudulGig from "./JudulGig";
import DeskripsiGig from "./DeskripsiGig";
import KategoriGig from "./KategoriGig";
import TipeLokasi from "./TipeLokasi";
import ModeGig from "./ModeGig";
import BudgetGig from "./BudgetGig";
import LokasiKota from "./LokasiKota";
import TanggalPengerjaan from "./TanggalPengerjaan";
import JamPengerjaan from "./JamPengerjaan";
import FotoGig from "./FotoGig";
import PersetujuanGig from "./PersetujuanGig";

export default function PostGigForm() {
    const navigate = useNavigate();
    const [agreed, setAgreed] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Submit form gig");
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
                    title="Gig = Cari Jagoan buat Bantuin Lu"
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
                <TipeLokasi />
                <ModeGig />
                <BudgetGig />
                <LokasiKota />
                <TanggalPengerjaan />
                <JamPengerjaan />
                <FotoGig />
                
                <PersetujuanGig agreed={agreed} setAgreed={setAgreed} />

                
                <button 
                    type="submit"
                    className="w-full font-bold py-4 rounded-2xl mt-4 transition-colors bg-ungu text-white hover:bg-unguterang disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Gaskeun Posting! 🚀
                </button>

            </form>
        </div>
    );
}
