export default function DeskripsiGig() {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Deskripsi Gig</label>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 focus-within:border-ungu transition-colors">
                <textarea 
                    name="description"
                    rows={4}
                    placeholder="Jelasin kerjanya ngapain, batas waktunya kapan, dan hasil akhirnya harus gimana." 
                    className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-500 resize-none"
                ></textarea>
            </div>
        </div>
    );
}
