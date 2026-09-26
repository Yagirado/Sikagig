import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import randomIcon from "../../assets/random.webp";
import { Coffee, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router";

const urgencyStyles = {
    santai: { icon: Coffee, color: "text-green-400" },
    segera: { icon: Clock, color: "text-yellow-400" },
    mendesak: { icon: AlertTriangle, color: "text-red-400" },
};

function UrgencyBadge({ urgency }) {
    const config = urgencyStyles[urgency?.trim().toLowerCase()];
    const Icon = config?.icon;

    return (
        <span className="inline-flex items-center gap-2">
            {Icon && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a]">
                    <Icon
                        size={15}
                        strokeWidth={2}
                        className={config.color}
                        aria-hidden="true"
                    />
                </span>
            )}
            <span className="flex flex-col gap-0.5">
                <span className="text-center text-[8px]">
                    Tingkat Urgensi
                </span>
                <span className="capitalize">{urgency}</span>
            </span>
        </span>
    );
}

export default function GigCards({ gigs, loading, error, categories, searchQuery, search }){
    const [now, setNow] = useState(() => Date.now());
    
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 60_000);

        return () => clearInterval(interval);
    }, []);
    
    function formatWaktuLalu(dateString) {
        const timestamp = new Date(dateString).getTime();

        if (!Number.isFinite(timestamp)) return "";

        const selisih = Math.max(0, now - timestamp);
        const menit = Math.floor(selisih / (1000 * 60));
        const jam = Math.floor(menit / 60);
        const hari = Math.floor(jam / 24);

        if (hari >= 1) return `${hari}h lalu`;
        if (jam >= 1) return `${jam}j lalu`;

        return `${menit}m lalu`;
    }


    return(
        <div className="flex flex-col gap-4 " aria-live="polite">
            {loading ? (
                <p className="py-6 text-center text-sm text-gray-400">
                    Mencari gig...
                </p>   
            ) : error ? (
                <p role="alert" className="py-6 text-center text-sm text-red-400">
                    {error}
                </p>
            ) : gigs.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">
                    {searchQuery
                        ? `Tidak ada gig dengan judul yang cocok dengan "${search}".`
                        : "Belum ada gig."}
                </p>
            ) : (
                gigs.map((gig) => (
                    <Link
                        key={gig.id}
                        to={`/gig/${gig.id}`}
                        className="h-fit w-auto mt-3 bg-dark rounded-3xl border border-unguterang shadow-[0_0_16px_0] shadow-unguterang/20"
                    >
                        <div className="flex items-center justify-between my-4 mx-4">
                            <span className="inline-flex items-center gap-4 rounded-full bg-light/50 px-3 py-2 text-xs font-black tracking-wider text-white">
                                <span className="relative h-3 w-3 shrink-0 ml-1.5">
                                    <img
                                        src={categories.find(
                                            (category) => category.name.toLocaleLowerCase() ===
                                            gig.category?.trim().toLocaleLowerCase()
                                        )?.image ?? randomIcon
                                        }
                                        alt=""
                                        className="
                                            absolute left-1/2 top-1/2
                                            h-9 w-9 max-w-none
                                            -translate-x-1/2 -translate-y-1/2
                                            object-contain"
                                    />
                                </span>
                                {gig.category}
                            </span>
                            <span className="bg-unguterang/15 border border-unguterang uppercase tracking-wider text-unguterang text-[10px] font-black rounded-full px-2 py-1"> 
                                {gig.status.replaceAll("_", " ")}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 mx-4 text-white">
                            <div className="mt-4">
                                <h2 className="wrap-break-words text-lg font-extrabold leading-snug">
                                    {gig.title}
                                </h2>

                                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-300">
                                    {gig.description}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mx-4 mt-4 pb-4 border-b border-gray-700">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ungu">
                                    <UserRound size={24} className="text-white" />
                                </div>
                                <span className="text-white wrap-break-words text-xs">
                                    {gig.user?.fullName ?? "Pengguna"}
                                </span>
                            </div>
                            <div className="ml-auto shrink-0 text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Per Gig
                                </p>
                                <p className="mt-0.5 text-xl font-black text-unguterang">
                                    {Number(gig.budget).toLocaleString("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                        maximumFractionDigits: 0,
                                    })}
                                </p>
                            </div>
                        </div>
                        <div
                            className="
                                flex items-center justify-between 
                                py-4 mx-4 text-xs font-semibold text-gray-400
                            "
                        >
                            <UrgencyBadge urgency={gig.urgency} />
                            <time 
                                dateTime={gig.created_at}
                                title={new Date(gig.created_at).toLocaleString("id-ID")}
                            >
                                {formatWaktuLalu(gig.created_at)}
                            </time>
                        </div>
                    </Link>
                ))
            )}
        </div>
    )
}