import { ArrowLeft, Briefcase } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";

import NamaJasa from "./NamaJasa";
import DeskripsiJasa from "./DeskripsiJasa";
import KategoriJasa from "./KategoriJasa";
import PaketHarga from "./PaketHarga";
import FormBrief from "./FormBrief";
import JenisJasa from "./JenisJasa";
import PersiapanJuragan from "./PersiapanJuragan";
import PortfolioJasa from "./PortfolioJasa";
import PersetujuanJasa from "./PersetujuanJasa";
import InfoCard from "../post/InfoCard";

export default function TawarkanJasaForm() {
    const navigate = useNavigate();
    const [agreed, setAgreed] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Submit form jasa");
    };

    return (
        <div className="mobile-container text-white bg-[#121212] min-h-screen pb-20">
            
            <div className="flex items-center gap-4 px-6 py-4 -mx-6 -mt-6 sticky top-0 bg-[#121212] z-10 border-b border-gray-800">
                <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-gray-800 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">Nawarin Jasa</h1>
            </div>

            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-6">
                
                
                <InfoCard 
                    icon={Briefcase}
                    title="Ini tempat jualan skill lu, bukan cari orang."
                    description="Tulis jasa yang bisa lu lakuin. Pembeli nanti minta penawaran dulu, lu kasih harga final, baru uang ditahan aman kalau mereka setuju bayar."
                    iconBgClass="bg-ungu/10 border-ungu/20"
                    iconColorClass="text-unguterang"
                />

                <NamaJasa />
                <DeskripsiJasa />
                <KategoriJasa />
                <PaketHarga />
                
                <FormBrief />
                <JenisJasa />
                <PersiapanJuragan />
                <PortfolioJasa />
                <PersetujuanJasa agreed={agreed} setAgreed={setAgreed} />

                
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
