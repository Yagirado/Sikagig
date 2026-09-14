import { Image } from "lucide-react";

export default function PortfolioJasa() {
    return (
        <div className="flex flex-col gap-2 mt-4">
            <button 
                type="button"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-gray-800 bg-[#1a1a1a] hover:bg-gray-800 text-white transition-colors font-bold text-sm"
            >
                <Image size={18} className="text-red-500" />
                Tambah portfolio/lampiran wajib (0/5)
            </button>
        </div>
    );
}
