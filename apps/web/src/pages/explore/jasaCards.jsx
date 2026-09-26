import { Award, Clock, Package, RefreshCw, ShoppingBag, Star, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

function formatWaktuLalu(dateString, now) {
    if (!dateString) return "";

    const timestamp = new Date(dateString).getTime();
    if (!Number.isFinite(timestamp)) return "";

    const menit = Math.floor(Math.max(0, now - timestamp) / 60_000);
    const jam = Math.floor(menit / 60);
    const hari = Math.floor(jam / 24);

    if (hari >= 1) return `${hari}h lalu`;
    if (jam >= 1) return `${jam}j lalu`;
    return `${menit}m lalu`;
}

function JasaCard({ jasa, now }) {
    const waktuPosting = formatWaktuLalu(jasa.created_at, now);
    const packages = Array.isArray(jasa.packages)
        ? jasa.packages.filter((paket) => paket.tampilkan !== false)
        : [];

    const cheapest = packages
        .filter((paket) =>
            paket.harga != null &&
            String(paket.harga).trim() !== "" &&
            Number.isFinite(Number(paket.harga)) &&
            Number(paket.harga) >= 0
        )
        .reduce((selected, paket) => {
            if (!selected || Number(paket.harga) < Number(selected.harga)) {
                return paket;
            }

            return selected;
        }, null);

    const rawPrice = cheapest?.harga ?? jasa.price;
    const price = rawPrice == null || String(rawPrice).trim() === ""
        ? NaN
        : Number(rawPrice);

    const ratingCount = Number(jasa.rating_count ?? 0);
    const average = jasa.rating_average == null
        ? NaN
        : Number(jasa.rating_average);

    const hasRating = ratingCount > 0 &&
        Number.isFinite(average) &&
        average >= 1 &&
        average <= 5;

    return (
        <Link
            to={`/jasa/${jasa.id}`}
            className="block h-fit w-auto mt-3 bg-dark rounded-3xl border border-unguterang shadow-[0_0_12px_0] shadow-unguterang/20"
        >
            <div className="mx-4 my-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-black">
                    <span className="inline-flex items-center gap-1 rounded-full bg-ungu/40 px-2.5 py-1.5 text-unguterang">
                        <Award size={14} />
                        Jasa {jasa.category}
                    </span>

                    {packages.length > 1 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-light/40 px-2.5 py-1.5 text-light">
                            <Package size={14} />
                            {packages.length} paket
                        </span>
                    )}
                </div>

                {hasRating && (
                    <span className="inline-flex items-center gap-1 text-xs text-white">
                        <Star size={14} className="text-unguterang" />
                        {average.toFixed(1)} ({ratingCount})
                    </span>
                )}
            </div>

            <div className="mx-6 mt-4 mb-4 border-b border-gray-800 pb-2 text-white">
                <h2 className="wrap-break-words text-lg font-extrabold leading-snug">
                    {jasa.name}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-300">
                    {jasa.description}
                </p>
            </div>

            <div className="mx-4 mb-4 rounded-2xl border border-dashed border-unguterang/40 bg-ungu/10 px-3.5 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-unguterang">
                    Paket mulai dari
                </p>
                <p className="mt-1 text-2xl font-extrabold text-unguterang">
                    {Number.isFinite(price) && price >= 0
                        ? `Rp ${price.toLocaleString("id-ID")}`
                        : "Harga belum tersedia"}
                </p>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                    <div className="flex flex-wrap items-center gap-3 text-gray-400">
                        {cheapest?.estimasi && (
                            <span className="inline-flex items-center gap-1.5">
                                <Clock size={14} />
                                {cheapest.estimasi}
                            </span>
                        )}

                        {cheapest?.revisi != null &&
                            String(cheapest.revisi).trim() !== "" && (
                                <span className="inline-flex items-center gap-1.5">
                                    <RefreshCw size={14} />
                                    {cheapest.revisi} revisi
                                </span>
                            )}
                    </div>

                    <span className="ml-auto inline-flex items-center gap-1.5 text-unguterang">
                        <ShoppingBag size={14} />
                        Beli langsung
                    </span>
                </div>
            </div>

            <div className="mx-6 my-2 mb-4 flex items-center justify-between gap-3 text-xs font-semibold text-white">
                <div className="flex min-w-0 items-center gap-1">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ungu">
                        <UserRound size={16} />
                    </div>
                    <span className="min-w-0 wrap-break-words">
                        {jasa.user?.fullName ?? "Pengguna"}
                    </span>
                </div>
                {waktuPosting && (
                    <time
                        dateTime={jasa.created_at}
                        title={new Date(jasa.created_at).toLocaleString("id-ID")}
                        className="shrink-0 whitespace-nowrap text-gray-400"
                    >
                        {waktuPosting}
                    </time>
                )}
            </div>
        </Link>
    );
}

export default function JasaCards({ jasas = [], loading, error, search, searchQuery }) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <p className="py-6 text-center text-sm text-gray-400">
                Mencari jasa...
            </p>
        );
    }

    if (error) {
        return (
            <p role="alert" className="py-6 text-center text-sm text-red-400">
                {error}
            </p>
        );
    }

    if (jasas.length === 0) {
        return (
            <p className="py-6 text-center text-sm text-gray-400">
                {searchQuery
                    ? `Tidak ada jasa dengan nama yang cocok dengan "${search}".`
                    : "Belum ada jasa."}
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-4" aria-live="polite">
            {jasas.map((jasa) => (
                <JasaCard key={jasa.id} jasa={jasa} now={now} />
            ))}
        </div>
    );
}
