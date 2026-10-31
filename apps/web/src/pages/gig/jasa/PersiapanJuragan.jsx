export default function PersiapanJuragan() {
    return (
        <div className="flex flex-col gap-2 mt-4">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Yang Perlu Disiapkan Juragan</label>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 focus-within:border-ungu transition-colors">
                <textarea 
                    name="persiapan_juragan"
                    rows={4}
                    placeholder="Contoh: brief, contoh referensi, akses file, atau detail kebutuhan." 
                    className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-500 resize-none"
                ></textarea>
            </div>
        </div>
    );
}
