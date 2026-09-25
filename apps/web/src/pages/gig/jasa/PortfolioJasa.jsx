import { FilePlus, FileText, Loader2, CheckCircle2, X } from "lucide-react";
import { useState } from "react";

export default function PortfolioJasa({ onFilesChange }) {
    const [selectedFiles, setSelectedFiles] = useState([]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Reset value input agar bisa trigger onChange jika memilih file yang sama lagi
        e.target.value = "";

        const newEntries = files.map((file) => ({
            rawFile: file,
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + " MB",
            status: "loading"
        }));

        setSelectedFiles((prev) => {
            const combined = [...prev, ...newEntries].slice(0, 5); // Maksimal 5 file
            if (onFilesChange) {
                onFilesChange(combined.map((item) => item.rawFile));
            }
            return combined;
        });

        // Set status selesai setelah simulasi proses
        setTimeout(() => {
            setSelectedFiles((current) =>
                current.map((f) => ({ ...f, status: "success" }))
            );
        }, 1000);
    };

    const removeFile = (idxToRemove) => {
        setSelectedFiles((prev) => {
            const updated = prev.filter((_, idx) => idx !== idxToRemove);
            if (onFilesChange) {
                onFilesChange(updated.map((item) => item.rawFile));
            }
            return updated;
        });
    };

    return (
        <div className="flex flex-col gap-2 mt-4">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Portfolio / Lampiran Jasa
            </label>
            <label className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-gray-800 bg-[#1a1a1a] active:bg-gray-800 active:scale-[0.99] text-white transition-all font-bold text-sm cursor-pointer">
                <FilePlus size={18} className="text-ungu" />
                Tambah portfolio ({selectedFiles.length}/5)
                <input 
                    type="file" 
                    accept="image/*, application/pdf" 
                    multiple 
                    className="hidden" 
                    onChange={handleFileChange}
                />
            </label>
            <span className="text-[10px] text-gray-500">*Menerima format gambar dan PDF (maks. 5 file)</span>

            {/* List Tampilan File yang Diupload */}
            {selectedFiles.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                    {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-[#1a1a1a] border border-gray-800 p-3 rounded-xl relative group">
                            <div className="p-2 bg-dark rounded-lg shrink-0">
                                <FileText size={16} className="text-gray-400" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-bold text-gray-200 truncate pr-6">{file.name}</p>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] text-gray-500">{file.size}</span>
                                    {file.status === "loading" ? (
                                        <span className="text-[10px] text-blue-400 flex items-center gap-1">
                                            <Loader2 size={10} className="animate-spin" /> Memuat...
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-green-400 flex items-center gap-1">
                                            <CheckCircle2 size={10} /> Selesai
                                        </span>
                                    )}
                                </div>
                                {/* Progress Bar Animasi */}
                                <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ease-out ${file.status === 'loading' ? 'w-1/3 bg-blue-500' : 'w-full bg-green-500'}`}
                                    />
                                </div>
                            </div>
                            
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    removeFile(idx);
                                }}
                                className="absolute right-3 top-3 text-gray-500 active:text-red-400 active:scale-95 transition-all p-1"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

