import { ImagePlus, FileImage, Loader2, CheckCircle2, X } from "lucide-react";
import { useState, useRef } from "react";

export default function FotoGig({ onFilesChange }) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const inputRef = useRef(null);

    const handleFileChange = (e) => {
        const newRawFiles = Array.from(e.target.files);
        if (newRawFiles.length === 0) return;

        setSelectedFiles(prev => {
            const combined = [...prev, ...newRawFiles];
            const sliced = combined.slice(0, 5); // Maks 5 file total
            // Kasih tau parent komponen file apa aja yang dipilih
            if (onFilesChange) onFilesChange(sliced);
            return sliced;
        });

        // Reset input value supaya bisa pilih file yang sama lagi
        e.target.value = "";
    };

    const removeFile = (idxToRemove) => {
        setSelectedFiles(prev => {
            const updated = prev.filter((_, idx) => idx !== idxToRemove);
            if (onFilesChange) onFilesChange(updated);
            return updated;
        });
    };

    return (
        <div className="flex flex-col gap-2 mt-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Foto / Gambar Gig</label>
            <label className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-gray-800 bg-[#1a1a1a] hover:bg-gray-800 text-gray-300 transition-colors font-bold text-sm cursor-pointer">
                <ImagePlus size={18} className="text-gray-400" />
                Tambah foto (maks. 5)
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                />
            </label>
            <span className="text-[10px] text-gray-500">*Hanya menerima format gambar (JPG, PNG, dsb)</span>

            {/* List Tampilan File yang Diupload */}
            {selectedFiles.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                    {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-[#1a1a1a] border border-gray-800 p-3 rounded-xl relative group">
                            <div className="p-2 bg-dark rounded-lg shrink-0">
                                <FileImage size={16} className="text-gray-400" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-bold text-gray-200 truncate pr-6">{file.name}</p>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                    <span className="text-[10px] text-green-400 flex items-center gap-1">
                                        <CheckCircle2 size={10} /> Siap upload
                                    </span>
                                </div>
                                {/* Progress bar */}
                                <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full w-full bg-green-500 transition-all duration-500" />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="absolute right-3 top-3 text-gray-500 hover:text-red-400 transition-colors"
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
