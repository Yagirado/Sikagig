import { Plus } from "lucide-react";

export default function FormBrief() {
    return (
        <div className="flex flex-col gap-3 p-4 rounded-3xl border border-gray-800 bg-[#1a1a1a] mt-2">
            <div className="flex flex-col gap-1">
                <h3 className="font-bold text-sm text-white">Form Brief (opsional)</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Susun pertanyaan sendiri kalau kamu butuh info spesifik dari juragan. Form ini wajib diisi sebelum mereka checkout atau minta penawaran custom.
                </p>
            </div>
            
            <button 
                type="button" 
                className="flex items-center justify-center gap-2 w-full py-3 mt-1 rounded-2xl border border-dashed border-gray-700 bg-transparent hover:bg-gray-800 text-ungu transition-colors font-bold text-xs"
            >
                <Plus size={16} />
                Buat Form Brief
            </button>
        </div>
    );
}
