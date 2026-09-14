import { Plus, ChevronDown, ChevronRight, ArrowUp, ArrowDown, Info } from "lucide-react";
import { useState } from "react";

export default function PaketHarga() {
    const [pakets, setPakets] = useState([
        {
            id: 1,
            nama: "Paket Standar",
            deskripsi: "",
            harga: "",
            estimasi: "",
            revisi: "",
            termasuk: "",
            tampilkan: true
        }
    ]);

    const [expandedId, setExpandedId] = useState(1);

    const activeCount = pakets.filter(p => p.tampilkan).length;
    
    // Hitung harga termurah dari paket yang aktif
    const activePrices = pakets
        .filter(p => p.tampilkan && p.harga !== "")
        .map(p => parseInt(p.harga, 10))
        .filter(p => !isNaN(p));
    
    const hargaMulai = activePrices.length > 0 
        ? Math.min(...activePrices).toLocaleString("id-ID")
        : "-";

    const tambahPaket = () => {
        if (pakets.length >= 4) return;
        const newId = Date.now();
        setPakets([...pakets, {
            id: newId,
            nama: `Paket ${pakets.length + 1}`,
            deskripsi: "",
            harga: "",
            estimasi: "",
            revisi: "",
            termasuk: "",
            tampilkan: true
        }]);
        setExpandedId(newId);
    };

    const updatePaket = (id, field, value) => {
        setPakets(pakets.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const moveUp = (e, index) => {
        e.stopPropagation();
        if (index === 0) return;
        const newPakets = [...pakets];
        [newPakets[index - 1], newPakets[index]] = [newPakets[index], newPakets[index - 1]];
        setPakets(newPakets);
    };

    const moveDown = (e, index) => {
        e.stopPropagation();
        if (index === pakets.length - 1) return;
        const newPakets = [...pakets];
        [newPakets[index + 1], newPakets[index]] = [newPakets[index], newPakets[index + 1]];
        setPakets(newPakets);
    };

    return (
        <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
                <h2 className="font-bold text-lg">Paket Harga</h2>
                <p className="text-xs text-gray-400">Buat beberapa paket supaya juragan bisa langsung beli tanpa nego. Minimal satu paket harus aktif.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
                <div>
                    <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase">Paket Aktif</p>
                    <p className="font-bold text-sm">{activeCount} dari {pakets.length}</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase">Harga Mulai</p>
                    <p className="font-bold text-sm">{hargaMulai !== "-" ? `Rp ${hargaMulai}` : "-"}</p>
                </div>
            </div>
            <p className="text-[10px] text-gray-500">Harga mulai dihitung otomatis dari paket aktif termurah dan dipakai untuk pencarian.</p>

            {/* List Paket */}
            <div className="flex flex-col gap-3">
                {pakets.map((paket, index) => {
                    const isExpanded = expandedId === paket.id;
                    
                    return (
                        <div key={paket.id} className="flex flex-col rounded-3xl border border-gray-800 bg-[#1a1a1a] overflow-hidden">
                            {/* Header (Clickable to expand/collapse) */}
                            <div 
                                onClick={() => setExpandedId(isExpanded ? null : paket.id)}
                                className={`flex items-center p-4 cursor-pointer hover:bg-gray-800/50 transition-colors ${isExpanded ? 'border-b border-gray-800' : ''}`}
                            >
                                <div className="mr-3 text-white">
                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-sm">{paket.nama || `Paket ${index + 1}`}</h3>
                                    <p className="text-[10px] text-gray-500">{paket.harga ? `Rp ${parseInt(paket.harga).toLocaleString('id-ID')}` : 'Harga belum diisi'}</p>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <button 
                                        type="button" 
                                        onClick={(e) => moveUp(e, index)}
                                        disabled={index === 0}
                                        className="p-1 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={(e) => moveDown(e, index)}
                                        disabled={index === pakets.length - 1}
                                        className="p-1 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
                                    >
                                        <ArrowDown size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Body (Expanded Content) */}
                            {isExpanded && (
                                <div className="flex flex-col gap-4 p-4">
                                    {/* Input Nama Paket */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-gray-300 uppercase">Nama Paket</label>
                                        <div className="bg-[#121212] border border-gray-800 rounded-xl p-3 focus-within:border-ungu">
                                            <input 
                                                type="text" 
                                                value={paket.nama}
                                                onChange={(e) => updatePaket(paket.id, 'nama', e.target.value)}
                                                className="w-full bg-transparent text-xs text-white outline-none" 
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Input Deskripsi Paket */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-gray-300 uppercase">Deskripsi Paket</label>
                                        <div className="bg-[#121212] border border-gray-800 rounded-xl p-3 focus-within:border-ungu">
                                            <textarea 
                                                rows={2} 
                                                placeholder="Ringkasan singkat isi paket ini." 
                                                value={paket.deskripsi}
                                                onChange={(e) => updatePaket(paket.id, 'deskripsi', e.target.value)}
                                                className="w-full bg-transparent text-xs text-white outline-none resize-none"
                                            ></textarea>
                                        </div>
                                    </div>

                                    {/* Input Harga */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-gray-300 uppercase">Harga</label>
                                        <div className="bg-[#121212] border border-gray-800 rounded-xl p-3 focus-within:border-ungu">
                                            <input 
                                                type="number" 
                                                placeholder="Contoh: 150000" 
                                                value={paket.harga}
                                                onChange={(e) => updatePaket(paket.id, 'harga', e.target.value)}
                                                className="w-full bg-transparent text-xs text-white outline-none" 
                                            />
                                        </div>
                                    </div>

                                    {/* Estimasi Pengerjaan */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-gray-300 uppercase">Estimasi Pengerjaan</label>
                                        <div className="bg-[#121212] border border-gray-800 rounded-xl p-3 focus-within:border-ungu">
                                            <input 
                                                type="text" 
                                                placeholder="Contoh: 3 hari kerja" 
                                                value={paket.estimasi}
                                                onChange={(e) => updatePaket(paket.id, 'estimasi', e.target.value)}
                                                className="w-full bg-transparent text-xs text-white outline-none" 
                                            />
                                        </div>
                                    </div>

                                    {/* Jumlah Revisi */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-gray-300 uppercase">Jumlah Revisi (Opsional)</label>
                                        <div className="bg-[#121212] border border-gray-800 rounded-xl p-3 focus-within:border-ungu">
                                            <input 
                                                type="number" 
                                                placeholder="Contoh: 3" 
                                                value={paket.revisi}
                                                onChange={(e) => updatePaket(paket.id, 'revisi', e.target.value)}
                                                className="w-full bg-transparent text-xs text-white outline-none" 
                                            />
                                        </div>
                                    </div>

                                    {/* Yang Termasuk */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-gray-300 uppercase">Yang Termasuk (Opsional)</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-[#121212] border border-gray-800 rounded-xl p-3 focus-within:border-ungu">
                                                <input 
                                                    type="text" 
                                                    placeholder="Contoh: 3 konsep pilihan" 
                                                    value={paket.termasuk}
                                                    onChange={(e) => updatePaket(paket.id, 'termasuk', e.target.value)}
                                                    className="w-full bg-transparent text-xs text-white outline-none" 
                                                />
                                            </div>
                                            <button type="button" className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Checkbox */}
                                    <div className="flex items-center gap-3 mt-2">
                                        <input 
                                            type="checkbox" 
                                            id={`show-paket-${paket.id}`}
                                            checked={paket.tampilkan}
                                            onChange={() => updatePaket(paket.id, 'tampilkan', !paket.tampilkan)}
                                            className="w-4 h-4 rounded border-gray-700 bg-[#121212] text-ungu accent-ungu cursor-pointer"
                                        />
                                        <label htmlFor={`show-paket-${paket.id}`} className="text-xs text-gray-300 cursor-pointer">
                                            Tampilkan paket ini ke juragan
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Tambah Paket Button */}
            {pakets.length < 4 && (
                <button 
                    type="button" 
                    onClick={tambahPaket}
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-dashed border-gray-700 bg-transparent hover:bg-[#1a1a1a] hover:border-gray-600 text-gray-300 transition-colors font-bold text-sm mt-2"
                >
                    <Plus size={16} className="text-red-500" />
                    Tambah Paket
                </button>
            )}

            {/* Info Message Custom */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#1a1a1a] border border-gray-800 mt-2">
                <Info size={16} className="text-gray-400 shrink-0" />
                <p className="text-[10px] text-gray-300 font-medium">
                    Penawaran custom dikirim per order lewat chat dan tidak muncul sebagai paket publik di halaman jasa kamu.
                </p>
            </div>

            {/* Placeholder for Harga Mulai Dari di paling bawah - if needed */}
            <div className="mt-4">
                <p className="text-[10px] text-gray-400 font-bold mb-2 uppercase">Harga Mulai Dari</p>
                <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
                    <p className="text-sm font-bold text-gray-300">
                        {hargaMulai !== "-" ? `Rp ${hargaMulai}` : "Belum ada paket aktif"}
                    </p>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                    Dihitung otomatis dari paket aktif termurah. Nilai ini dipakai untuk pencarian.
                </p>
            </div>

        </div>
    );
}
