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
            <div className="bg-[#121212] border border-gray-700 rounded-xl p-3 focus-within:border-ungu transition-colors mt-2">
                <textarea
                    name="brief_requirements"
                    rows={2}
                    placeholder="Contoh: Lampirkan link google drive atau referensi gaya desain."
                    className="w-full bg-transparent text-xs text-white outline-none placeholder-gray-500 resize-none"
                ></textarea>
            </div>
        </div>
    );
}
