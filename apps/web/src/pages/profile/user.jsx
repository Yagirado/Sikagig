import { useEffect, useState } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";

const PROFILE_COLORS = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-green-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-pink-500",
];

function formatPrice(price) {
    return `Rp ${Number(price || 0).toLocaleString("id-ID")}`;
}

export default function PublicProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function fetchProfile() {
            setLoading(true);
            setError("");

            try {
                const response = await fetch(`/api/users/${userId}/profile`, {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                    signal: controller.signal,
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Profil pengguna tidak dapat dimuat.");
                }

                if (!controller.signal.aborted) setProfile(data);
            } catch (fetchError) {
                if (!controller.signal.aborted) {
                    setError(fetchError.message || "Terjadi kesalahan jaringan.");
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        fetchProfile();
        return () => controller.abort();
    }, [userId]);

    const fullName = profile?.user?.fullName || "Pengguna";
    const initial = (fullName.trim()[0] || "U").toUpperCase();
    const profileColor = PROFILE_COLORS[fullName.length % PROFILE_COLORS.length];

    return (
        <div className="mobile-container min-h-screen bg-[#0d0d0f] pt-0! pb-28! text-white">
            <header className="sticky top-0 z-40 -mx-6 flex h-16 items-center justify-between border-b border-gray-800 bg-[#0d0d0f] px-6">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label="Kembali"
                    className="flex size-10 items-center justify-center rounded-full text-white active:bg-gray-800"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-extrabold">Profil Pengguna</h1>
                <span aria-hidden="true" className="size-10" />
            </header>

            {loading ? (
                <div role="status" className="py-16 text-center text-sm text-gray-400">
                    Memuat profil...
                </div>
            ) : error ? (
                <div className="py-16 text-center">
                    <p role="alert" className="text-sm text-red-400">{error}</p>
                    <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-ungu px-4 py-2 text-sm font-bold">
                        Coba lagi
                    </button>
                </div>
            ) : (
                <>
                    <section className="flex flex-col items-center py-9 text-center">
                        <div className={`flex h-20 w-20 items-center justify-center rounded-full ${profileColor} text-3xl font-extrabold text-white`}>
                            {initial}
                        </div>
                        <h2 className="mt-4 text-2xl font-extrabold">{fullName}</h2>
                    </section>

                    <section className="mb-9">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h3 className="text-xl font-extrabold">Gig yang Dibuat</h3>
                            <span className="shrink-0 text-sm font-bold text-rose-400">{profile.gigs.length} gig</span>
                        </div>
                        {profile.gigs.length ? (
                            <div className="flex flex-col gap-3">
                                {profile.gigs.map((gig) => (
                                    <Link key={gig.id} to={`/gig/${gig.id}`} className="rounded-3xl border border-gray-800 bg-[#19191c] p-4 transition-colors hover:border-gray-700">
                                        <h4 className="line-clamp-1 text-base font-extrabold">{gig.title}</h4>
                                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-300">{gig.description}</p>
                                        <div className="mt-3 flex items-center justify-between gap-3">
                                            <span className="text-sm font-extrabold text-rose-400">{formatPrice(gig.budget)} / {gig.mode === "barengan" ? "orang" : "gig"}</span>
                                            <span className="shrink-0 text-xs text-gray-400">{gig.category}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="py-5 text-center text-gray-400">Belum ada gig yang dibuat.</p>
                        )}
                    </section>

                    <section className="mb-9">
                        <h3 className="mb-4 text-xl font-extrabold">Jasa yang Ditawarkan</h3>
                        {profile.jasas.length ? (
                            <div className="flex flex-col gap-3">
                                {profile.jasas.map((jasa) => (
                                    <Link key={jasa.id} to={`/jasa/${jasa.id}`} className="rounded-3xl border border-gray-800 bg-[#19191c] p-4 transition-colors hover:border-gray-700">
                                        <p className="text-xs font-bold text-unguterang">{jasa.category || "Jasa"}</p>
                                        <h4 className="mt-1 line-clamp-1 text-base font-extrabold">{jasa.name}</h4>
                                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-300">{jasa.description}</p>
                                        <div className="mt-3 flex items-center justify-between gap-3">
                                            <span className="text-sm font-extrabold text-unguterang">Mulai {formatPrice(jasa.price)}</span>
                                            <span className="flex shrink-0 items-center gap-1 text-xs text-gray-300">
                                                <Star size={13} className="fill-unguterang text-unguterang" />
                                                {Number(jasa.rating_count) > 0 ? Number(jasa.rating_average).toFixed(1) : "Belum ada rating"}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="py-5 text-center text-gray-400">Belum ada jasa yang aktif.</p>
                        )}
                    </section>

                    <section className="mb-8">
                        <h3 className="mb-4 text-xl font-extrabold">Review Terbaru</h3>
                        {profile.reviews.length ? (
                            <div className="flex flex-col gap-3">
                                {profile.reviews.map((review) => (
                                    <article key={review.id} className="rounded-3xl border border-gray-800 bg-[#19191c] p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-bold">{review.user?.fullName || "Pengguna"}</p>
                                                <p className="mt-1 text-xs text-gray-400">Jasa: {review.jasa?.name || "Jasa"}</p>
                                            </div>
                                            <span className="flex shrink-0 items-center gap-1 font-bold text-unguterang">
                                                <Star size={14} className="fill-unguterang" /> {review.score}.0
                                            </span>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className="py-5 text-center text-gray-400">Belum ada review.</p>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
