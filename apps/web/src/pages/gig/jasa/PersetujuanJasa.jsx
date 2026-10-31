export default function PersetujuanJasa({ agreed, setAgreed }) {
    return (
        <div className="flex items-start gap-3 mt-4 bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800">
            <input 
                type="checkbox" 
                id="agree-rules-jasa"
                name="agreed"
                checked={agreed}
                onChange={() => setAgreed(!agreed)}
                className="w-5 h-5 rounded border-gray-700 bg-[#121212] text-ungu accent-ungu mt-0.5 shrink-0 cursor-pointer"
            />
            <label htmlFor="agree-rules-jasa" className="text-[11px] text-gray-300 leading-relaxed cursor-pointer font-medium">
                Saya setuju menggunakan Sikagig untuk aktivitas yang legal dan tidak melanggar hukum/aturan yang berlaku (termasuk bukan untuk prostitusi, pornografi, SARA, perjudian, narkoba, penipuan, atau konten terlarang lainnya).
            </label>
        </div>
    );
}
