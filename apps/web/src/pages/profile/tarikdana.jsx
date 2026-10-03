import { ArrowLeft, Landmark, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getCsrfToken } from "../../lib/api";

const ewallets = ["DANA", "GoPay", "OVO", "ShopeePay", "LinkAja"];
const banks = ["BCA", "BRI", "BNI", "Mandiri", "CIMB Niaga", "Permata", "BSI"];

const formatNumber = (value) =>
    new Intl.NumberFormat("id-ID").format(Number(value || 0));

export default function TarikDana() {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [amount, setAmount] = useState("");
    const [destinationType, setDestinationType] = useState("ewallet");
    const [provider, setProvider] = useState(ewallets[0]);
    const [accountName, setAccountName] = useState("");
    const [destinationNumber, setDestinationNumber] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetch("/api/wallet", { credentials: "include", headers: { Accept: "application/json" } })
            .then((response) => response.json())
            .then((data) => setBalance(data.balance ?? 0))
            .catch(() => setBalance(0));
    }, []);

    function changeType(type) {
        setDestinationType(type);
        setProvider(type === "bank" ? banks[0] : ewallets[0]);
        setDestinationNumber("");
        setError("");
    }

    async function submit(event) {
        event.preventDefault();
        const value = Number(amount);
        if (!Number.isInteger(value) || value < 10000) {
            setError("Minimal tarik dana Rp 10.000.");
            return;
        }
        if (value > balance) {
            setError("Nominal melebihi saldo wallet.");
            return;
        }

        setSubmitting(true);
        setError("");
        setSuccess("");
        try {
            const csrfToken = await getCsrfToken();
            const response = await fetch("/api/withdrawals", {
                method: "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({
                    amount: value,
                    destination_type: destinationType,
                    provider,
                    account_name: accountName,
                    destination_number: destinationNumber,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message ?? "Gagal membuat permintaan tarik dana.");

            setBalance((current) => current - value);
            setAmount("");
            setAccountName("");
            setDestinationNumber("");
            setSuccess("Permintaan tarik dana berhasil dibuat dan sedang diproses.");
        } catch (requestError) {
            setError(requestError.message ?? "Gagal terhubung ke server.");
        } finally {
            setSubmitting(false);
        }
    }

    const isBank = destinationType === "bank";
    const options = isBank ? banks : ewallets;

    return (
        <div className="mobile-container min-h-screen text-white pt-1! pb-8">
            <header className="sticky top-0 z-10 -mx-6 bg-[#151515] px-6 py-2.5">
                <div className="relative flex items-center justify-center py-2">
                    <h1 className="text-lg font-black">Tarik Dana</h1>
                    <button onClick={() => navigate("/profile")} className="absolute left-0 rounded-2xl border border-gray-700 bg-neutral-900 p-2.5 text-gray-300 transition-colors active:bg-gray-800">
                        <ArrowLeft size={18} />
                    </button>
                </div>
            </header>

            <main className="pt-5">
                <section className="rounded-2xl border border-gray-700 bg-dark p-4">
                    <p className="text-xs text-gray-400">SALDO YANG DAPAT DITARIK</p>
                    <p className="mt-1 text-2xl font-extrabold text-unguterang">Rp {formatNumber(balance)}</p>
                </section>

                <form onSubmit={submit} className="mt-5 space-y-5">
                    <label className="block">
                        <span className="text-sm font-bold">Nominal penarikan</span>
                        <div className="mt-2 flex items-center rounded-2xl border border-gray-700 bg-dark px-4 focus-within:border-ungu">
                            <span className="font-bold text-unguterang">Rp</span>
                            <input value={formatNumber(amount)} onChange={(event) => { setAmount(event.target.value.replace(/\D/g, "")); setError(""); }} inputMode="numeric" placeholder="0" className="w-full bg-transparent px-3 py-3 text-lg font-bold outline-none placeholder:text-gray-500" />
                        </div>
                        <span className="mt-1 block text-xs text-gray-500">Minimal Rp 10.000</span>
                    </label>

                    <div>
                        <p className="text-sm font-bold">Tujuan pencairan</p>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => changeType("ewallet")} className={`flex items-center gap-2 rounded-2xl border p-3 text-left ${!isBank ? "border-ungu bg-ungu/10 text-white" : "border-gray-700 bg-dark text-gray-300"}`}>
                                <Smartphone size={20} /><span className="text-sm font-bold">E-Wallet</span>
                            </button>
                            <button type="button" onClick={() => changeType("bank")} className={`flex items-center gap-2 rounded-2xl border p-3 text-left ${isBank ? "border-ungu bg-ungu/10 text-white" : "border-gray-700 bg-dark text-gray-300"}`}>
                                <Landmark size={20} /><span className="text-sm font-bold">Bank</span>
                            </button>
                        </div>
                    </div>

                    <label className="block">
                        <span className="text-sm font-bold">{isBank ? "Pilih bank" : "Pilih e-wallet"}</span>
                        <select value={provider} onChange={(event) => setProvider(event.target.value)} className="mt-2 w-full rounded-2xl border border-gray-700 bg-dark px-4 py-3 text-white outline-none focus:border-ungu">
                            {options.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                    </label>

                    <label className="block">
                        <span className="text-sm font-bold">Nama pemilik akun</span>
                        <input value={accountName} onChange={(event) => setAccountName(event.target.value)} required maxLength="100" placeholder="Sesuai akun tujuan" className="mt-2 w-full rounded-2xl border border-gray-700 bg-dark px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-ungu" />
                    </label>

                    <label className="block">
                        <span className="text-sm font-bold">{isBank ? "Nomor rekening" : "Nomor telepon e-wallet"}</span>
                        <input value={destinationNumber} onChange={(event) => setDestinationNumber(event.target.value)} required inputMode="tel" placeholder={isBank ? "Contoh: 1234567890" : "Contoh: 081234567890"} className="mt-2 w-full rounded-2xl border border-gray-700 bg-dark px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-ungu" />
                        {!isBank && <span className="mt-1 block text-xs text-gray-500">Semua e-wallet menggunakan nomor telepon sebagai tujuan pencairan.</span>}
                    </label>

                    {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
                    {success && <p role="status" className="rounded-xl bg-green-500/10 p-3 text-sm text-green-400">{success}</p>}

                    <button type="submit" disabled={submitting || balance < 10000} className="w-full rounded-2xl bg-ungu px-4 py-3.5 font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                        {submitting ? "Mengajukan penarikan..." : "Ajukan tarik dana"}
                    </button>
                </form>
            </main>
        </div>
    );
}
