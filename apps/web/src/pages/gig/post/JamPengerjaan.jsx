export default function JamPengerjaan() {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Jam Pengerjaan</label>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 focus-within:border-ungu transition-colors">
                <input 
                    name="jam_pengerjaan"
                    type="time" 
                    className="w-full bg-transparent text-sm text-gray-300 outline-none"
                    style={{ colorScheme: 'dark' }}
                />
            </div>
            <p className="text-xs text-gray-400 mt-1">Kapan pekerjaan fisik ini perlu dikerjakan atau dimulai.</p>
        </div>
    );
}
