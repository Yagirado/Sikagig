import { Search, PenTool, Trophy, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

export default function CreateGigOption() {
    const navigate = useNavigate();
    const handleSelectOption = (type) => {
        console.log("Navigasi ke pembuatan gig dengan tipe:", type);

    };

    return (
        <div className="mobile-container text-white">

            <div className="flex flex-col gap-3 mb-8">
                <h1 className="text-3xl font-black text-white">
                    Lagi Butuh Apa Nih??
                </h1>
                <p className="text-sm text-gray-400">
                    Butuh Bantuan? Mau Jualan Jasa? Atau Bikin Sayembara Menarik?
                </p>
            </div>


            <div className="flex flex-col gap-4">

                {/* BUAT GIG */}
                <button
                    onClick={() => handleSelectOption('Buat Gig')}
                    className="
                    flex items-center justify-between p-4 rounded-3xl bg-dark border border-gray-700 hover:bg-gray-800 transition-all text-left"
                >
                    <div className="flex items-center gap-4">

                        <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-ungu/10 border border-ungu/20">
                            <Search className="text-unguterang" size={20} />
                        </div>

                        <div className="flex-1">
                            <h3 className="font-bold text-white mb-1">Cari Bantuan</h3>
                            <p className="text-xs text-gray-400 leading-relaxed pr-2">
                                Tawarin Pekerjaan kalau lu butuh orang buat bantuin.
                            </p>
                        </div>
                    </div>

                    <ArrowRight className="text-gray-500 shrink-0" size={20} />
                </button>

                {/* NAWARIN JASA */}
                <button
                    onClick={() => handleSelectOption('Nawarin Jasa')}
                    className="
                    flex items-center justify-between p-4 rounded-3xl bg-dark border border-gray-700 hover:bg-gray-800 transition-all text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-ungu/10 border border-ungu/20">
                            <PenTool className="text-unguterang" size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-white mb-1">Tawarkan Keahlian</h3>
                            <p className="text-xs text-gray-400 leading-relaxed pr-2">
                                Jual Jasamu Biar Orang Lain Bisa Nerima Jasa dari lu.
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="text-gray-500 shrink-0" size={20} />
                </button>

                {/* BIKIN SAYEMBARA */}
                <button
                    onClick={() => handleSelectOption('Sayembara')}
                    className="
                    flex items-center justify-between p-4 rounded-3xl bg-dark border border-gray-700 hover:bg-gray-800 transition-all text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-ungu/10 border border-ungu/20">
                            <Trophy className="text-unguterang" size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-white mb-1">Bikin Sayembara</h3>
                            <p className="text-xs text-gray-400 leading-relaxed pr-2">
                                Biar jagoan konpetisi, terus lu bisa milih mana yang paling pas buat lu.
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="text-gray-500 shrink-0" size={20} />
                </button>

            </div>
        </div>
    );
}
