export default function InfoCard({ icon: Icon, title, description, iconBgClass, iconColorClass }) {
    return (
        <div className="flex gap-4 p-4 rounded-2xl bg-[#1a1a1a] border border-gray-800">
            <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl ${iconBgClass} ${iconColorClass}`}>
                <Icon size={20} />
            </div>
            <div>
                <h3 className="font-bold text-sm mb-1">{title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
}
