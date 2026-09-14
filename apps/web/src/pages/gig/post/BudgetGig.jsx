export default function BudgetGig() {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Budget (Rp)</label>
            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 focus-within:border-ungu transition-colors">
                <span className="text-gray-400 font-medium">Rp</span>
                <input 
                    name="budget"
                    type="number" 
                    placeholder="Contoh: 300000" 
                    className="w-full bg-transparent text-sm text-white font-medium outline-none placeholder-gray-500"
                />
            </div>
        </div>
    );
}
