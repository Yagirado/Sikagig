export default function JudulGig() {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Judul Gig</label>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 focus-within:border-ungu transition-colors">
                <input 
                    name="title"
                    type="text" 
                    placeholder="misal: Butuh orang beliin kopken" 
                    className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-500"
                />
            </div>
            <div className="text-right text-[10px] text-gray-500">0/15</div>
        </div>
    );
}
