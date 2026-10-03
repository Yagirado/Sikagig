import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    HandCoins,
    LockKeyhole,
    Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getCsrfToken } from "../../lib/api";


const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID").format(Number(value ?? 0));

const statusInfo = {
    awaiting_payment: {
        label: "Menunggu Pembayaran",
        className: "bg-amber-500/15 text-amber-400",
        Icon: Clock3,
    },
    holding: {
        label: "Dana ditahan escrow",
        className: "bg-blue-500/15 text-blue-400",
        Icon: LockKeyhole,
    },
    released: {
        label: "Dana sudah dilepas",
        className: "bg-emerald-500/15 text-emerald-400",
        Icon: CheckCircle2,
    },
    refunded: {
        label: "Dana dikembalikan",
        className: "bg-zinc-500/15 text-zinc-400",
        Icon: CheckCircle2,
    },
};

function escrowTitle(escrow) {
    return (
        escrow.proposal?.gig?.title ??
        escrow.jasa_order?.jasa?.name ??
        "Pekerjaan"
    );
}

function escrowType(escrow) {
    return escrow.proposal_id ? "Gig" : "Jasa";
}

export default function EscrowPayment() {
    const navigate = useNavigate();
    const [escrows, setEscrows] = useState([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState(null);
    const [releasingId, setReleasingId] = useState(null);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const loadData = useCallback(async () => {
        const [escrowResponse, walletResponse] = await Promise.all([
            fetch("/api/escrows?role=client", {
                credentials: "include",
                headers: { Accept: "application/json" },
            }),
            fetch("/api/wallet", {
                credentials: "include",
                headers: { Accept: "application/json" },
            }),
        ]);

        const escrowData = await escrowResponse.json();
        const walletData = await walletResponse.json();

        if (!escrowResponse.ok) {
            throw new Error(
                escrowData.message ?? "Gagal memuat daftar pembayaran."
            );
        }

        if (!walletResponse.ok) {
            throw new Error(
                walletData.message ?? "Gagal memuat saldo wallet."
            );
        }

        setEscrows(escrowData.escrows ?? []);
        setBalance(walletData.balance ?? 0);
    }, []);

    useEffect(() => {
        async function initialize() {
            try {
                setError("");
                await loadData();
            } catch (requestError) {
                setError(
                    requestError.message ?? "Gagal terhubung ke server."
                );
            } finally {
                setLoading(false);
            }
        }
        initialize();
    }, [loadData]);

        async function handlePayWithWallet(escrow) {
        if (balance < escrow.amount) {
            setError(
                `Saldo tidak cukup. Kamu membutuhkan Rp ${formatRupiah(
                    escrow.amount
                )}.`
            );
            return;
        }

        const isConfirmed = window.confirm(
            `Bayar Rp ${formatRupiah(
                escrow.amount
            )} dari saldo wallet? Dana akan ditahan di escrow sampai pekerjaan selesai.`
        );

        if (!isConfirmed) {
            return;
        }

        setPayingId(escrow.id);
        setError("");
        setSuccessMessage("");

        try {
            const csrfToken = await getCsrfToken();

            const response = await fetch(
                `/api/escrows/${escrow.id}/pay/wallet`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ?? "Pembayaran dengan wallet gagal."
                );
            }

            setSuccessMessage(data.message);
            await loadData();
        } catch (paymentError) {
            setError(
                paymentError.message ?? "Gagal terhubung ke server."
            );
        } finally {
            setPayingId(null);
        }
    }

    async function handleReleaseEscrow(escrow) {
        const payoutDescription = escrow.proposal_id
            ? "85% masuk ke wallet freelancer dan 15% ke wallet platform"
            : "seluruh dana masuk ke wallet freelancer";
        const isConfirmed = window.confirm(
            `Lepaskan Rp ${formatRupiah(
                escrow.amount
            )}? ${payoutDescription}. Tindakan ini tidak dapat dibatalkan.`
        );

        if (!isConfirmed) {
            return;
        }

        setReleasingId(escrow.id);
        setError("");
        setSuccessMessage("");

        try {
            const csrfToken = await getCsrfToken();

            const response = await fetch(
                `/api/escrows/${escrow.id}/release`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ?? "Gagal melepaskan dana escrow."
                );
            }

            setSuccessMessage(data.message);
            await loadData();
        } catch (releaseError) {
            setError(
                releaseError.message ?? "Gagal terhubung ke server."
            );
        } finally {
            setReleasingId(null);
        }
    }

    return (
        <div className="mobile-container text-white pt-1!">
            <header className="sticky top-0 z-10 -mx-6 bg-[#151515] px-6 py-2.5">
                <div className="relative flex items-center justify-center py-2">
                    <h1 className="text-lg font-black">Pembayaran</h1>
                    <button type="button" onClick={() => navigate(-1)} aria-label="Kembali" className="absolute left-0 rounded-2xl border border-gray-700 bg-neutral-900 p-2.5 text-gray-300 transition-colors active:bg-gray-800">
                        <ArrowLeft size={18} />
                    </button>
                </div>
            </header>

            <main className="pt-5">
                <section className="rounded-3xl border border-ungu/40 bg-ungu/10 p-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-ungu p-3 text-white">
                            <Wallet size={22} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-300">
                                Saldo Wallet
                            </p>
                            <p className="text-2xl font-black text-white">
                                Rp {formatRupiah(balance)}
                            </p>
                        </div>
                    </div>
                    <p className="mt-4 text-xs leading-relaxed text-gray-400">
                        Saat dibayar, dana tidak langsung masuk ke freelancer.
                        Dana akan ditahan di escrow sampai pekerjaan selesai.
                    </p>
                </section>

                {successMessage && (
                    <p role="status" className="mt-4 rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-300">
                        {successMessage}
                    </p>
                )}
                {error && (
                    <p role="alert" className="mt-4 rounded-2xl bg-red-500/10 p-4 text-sm text-red-300">
                        {error}
                    </p>
                )}

                <h2 className="mt-7 text-lg font-black">
                    Pesanan dan Gig kamu
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                    Bayar transaksi yang sudah diterima freelancer.
                </p>

                {loading && (
                    <p className="py-10 text-center text-sm text-gray-400">
                        Memuat pembayaran...
                    </p>
                )}

                {!loading && escrows.length === 0 && (
                    <p className="mt-4 rounded-2xl border border-gray-700 bg-dark p-5 text-center text-sm text-gray-400">
                        Belum ada escrow yang perlu dibayar
                    </p>
                )}

                <div className="mt-4 flex flex-col gap-3">
                    {escrows.map((escrow) => {
                        const status = statusInfo[escrow.status] ?? statusInfo.awaiting_payment;
                        const StatusIcon = status.Icon;
                        const isAwaiting = escrow.status === "awaiting_payment";
                        const insufficientBalance = balance < escrow.amount;
                            return (
                                <article key={escrow.id} className="rounded-3xl border border-gray-700 bg-dark p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-unguterang">
                                            {escrowType(escrow)}
                                        </p>
                                        <h3 className="mt-1 font-bold text-white">
                                            {escrowTitle(escrow)}
                                        </h3>
                                    </div>

                                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>
                                        <StatusIcon size={14} />
                                        {status.label}
                                    </span>
                                </div>

                                <div className="mt-5 border-t border-gray-700 pt-4">
                                    <p className="text-xs text-gray-400">
                                        Dana yang ditahan
                                    </p>
                                    <p className="mt-1 text-xl font-black text-unguterang">
                                        Rp {formatRupiah(escrow.amount)}
                                    </p>
                                </div>

                                {isAwaiting && (
                                    <button type="button" disabled={
                                            payingId === escrow.id ||
                                            insufficientBalance
                                        }
                                        onClick={() =>
                                            handlePayWithWallet(escrow)
                                        }
                                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-ungu px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                                        <HandCoins size={18} />
                                        {payingId === escrow.id
                                            ? "Memproses pembayaran..."
                                            : insufficientBalance
                                            ? "Saldo wallet tidak cukup"
                                            : "Bayar dengan saldo wallet"}
                                    </button>
                                )}
                                {escrow.status === "holding" && (
                                    <button type="button" disabled={releasingId === escrow.id}
                                        onClick={() => handleReleaseEscrow(escrow)}
                                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
                                        <CheckCircle2 size={18} />
                                        {releasingId === escrow.id
                                            ? "Melepaskan dana..."
                                            : "Pekerjaan selesai, lepaskan dana"}
                                    </button>
                                )}
                            </article>
                        );
                    })}
                </div>
            </main>
        </div>
    )
}
