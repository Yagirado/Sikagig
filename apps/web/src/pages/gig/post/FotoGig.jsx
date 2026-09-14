export default function FotoGig() {
    return (
        <div className="flex flex-col gap-2 mt-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Foto / gambar gig</label>
            <button 
                type="button"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-gray-800 bg-[#1a1a1a] hover:bg-gray-800 text-gray-300 transition-colors font-bold text-sm"
            >
                <div className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </div>
                Tambah foto wajib (maks. 5)
            </button>
        </div>
    );
}
