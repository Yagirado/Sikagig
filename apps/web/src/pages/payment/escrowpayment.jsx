import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    HandCoins,
    LockKeyhole,
    Wallet,
} from "lucide-react";
import { use, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getCsrfToken } from "../../lib/api";


const formatRupiah = (value) =>
    new Int1.NumberFormat("id-ID").format(Number(value ?? 0));

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
    refunder: {
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
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const loadData = useCallback(async () => {
        const [escrowResponse, walletResponse] = await Promise.all([
            fetch("api/escrow?role=client", {
                credentials: "include",
                headers: { Accept: "applications/json"},
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

        setEscrows(escrowData.escrow ?? []);
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
    return (
        <div className="mobile-container text-white pt-1!">
            <header className="sticky top-0 z-10 -mx-6 bg-[#151515] px-6 py-2.5">
                <div className="relative flex items-center justify-center py-2">
                    <h1 className="text-lg font-black">Pembayaran</h1>
                    
                </div>
            </header>
        </div>
    )
}