import { ArrowLeft, Mail, Clipboard, CircleCheckBig } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import ErrorPopUp from "../../components/loginMod/errorPopUp";
import { remainingSeconds, resendOtp, retryDeadline, verifyOtp } from "../../lib/otp";

export default function Otp(){
    const [otp, setOtp] = useState(["", "", "", ""]);
    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const requestInFlight = useRef(false);
    const [now, setNow] = useState(() => Date.now());
    const { challengeId, email, flow, resendAvailableAt = 0 } = location.state ?? {};
    const remaining = remainingSeconds(resendAvailableAt, now);
    const busy = loading || resending;
    const backPath = flow === "register" ? "/register" : "/login";

    useEffect(() => {
        const tick = () => setNow(Date.now());
        const timer = window.setInterval(tick, 1000);
        window.addEventListener("focus", tick);
        return () => {
            window.clearInterval(timer);
            window.removeEventListener("focus", tick);
        };
    }, []);

    async function handleSubmit(event, code){
        event.preventDefault();

        const otpCode = code ?? otp.join("");
        if (otpCode.length !== 4 || !/^\d{4}$/.test(otpCode)) return;

        if (requestInFlight.current) return;

        requestInFlight.current = true;
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        try{
            await verifyOtp({ flow, challengeId, code: otpCode });
            navigate("/dashboard", { replace: true });
        } catch (error) {
            setErrorMessage(error.message ?? "Terjadi kesalahan.");
        } finally {
            requestInFlight.current = false;
            setLoading(false);
        }
    }

    async function handleResend() {
        if (requestInFlight.current || remainingSeconds(resendAvailableAt) > 0) return;
        requestInFlight.current = true;
        setResending(true);
        setErrorMessage("");
        setSuccessMessage("");
        try {
            const data = await resendOtp(location.state);
            setNow(Date.now());
            await navigate("/otp", {
                replace: true,
                state: {
                    ...location.state,
                    challengeId: data.challenge_id,
                    resendAvailableAt: retryDeadline(data.retry_after),
                },
            });
            setOtp(["", "", "", ""]);
            setSuccessMessage("Kode OTP baru telah dikirim. Silakan cek email kamu.");
            inputRefs.current[0]?.focus();
        } catch (error) {
            if (error.retryAfter !== undefined) {
                setNow(Date.now());
                await navigate("/otp", {
                    replace: true,
                    state: { ...location.state, resendAvailableAt: retryDeadline(error.retryAfter) },
                });
            }
            setErrorMessage(error.message ?? "Gagal mengirim ulang OTP.");
        } finally {
            requestInFlight.current = false;
            setResending(false);
        }
    }

    function handleChange(value, index){
        if(!/^\d?$/.test(value)) return;

        const next = otp.map((digit, i) => (i === index ? value : digit));
        setOtp(next);

        if(value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        if (value && next.every((d) => d !== "")) {
            handleSubmit({ preventDefault: () => {} }, next.join(""));
        }
    }

    function handleKeyDown(event, index) {
        if (event.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }

    async function handlePaste() {
        try {
            const text = await navigator.clipboard.readText();
            const code = text.trim();

            if (!/^\d{4}$/.test(code)) {
                return;
            }

            setOtp(code.split(""));
            inputRefs.current[3]?.focus();
            handleSubmit({ preventDefault: () => {} }, code);
        } catch {
            setErrorMessage("Clipboard tidak bisa dibaca. Izinkan akses atau isi OTP manual.");
        }
    }

    if (!challengeId || !email || !["login", "register"].includes(flow)) {
        return <Navigate to={backPath} replace />;
    }

    return(
        <div className="mobile-container py-0!">
            <div className="relative flex justify-center items-center px-6 pt-10 pb-3">
                <Link
                        to={backPath}
                        className="
                            group absolute left-0 top-10 flex h-11 w-11 items-center justify-center rounded-full
                            border border-gray-800 bg-dark
                            active:border-gray-800/40 active:bg-dark/40"
                        draggable={false}
                    >
                        <ArrowLeft size={24} className="shrink-0 text-white group-active:text-white/40" />
                </Link>
                <div className="mx-auto mt-40 mb-2 sm:mt-3 w-fit rounded-full border border-ungu/30 bg-ungu/20 p-6">
                    <Mail  
                        size={32}
                        className="text-unguterang"
                    />
                </div>
            </div>

            <div className="flex flex-col justify-center items-center text-white gap-2 pb-1">
                <h2 className="text-[28px] font-black">
                    Cek email kamu
                </h2>
                <p className="w-full text-center text-[14px] tracking-wide wrap-break-word">
                    Udah kita kirim ke
                    <span className="ml-1 text-unguterang font-black">
                        {email}
                    </span> 
                </p>
            </div>

            <div className="my-6 flex justify-center gap-4">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={(element) => {
                            inputRefs.current[index] = element;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        disabled={busy}
                        aria-label={`Angka OTP ke-${index + 1}`}
                        onChange={(event) => handleChange(event.target.value, index)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        onFocus={(event) => event.currentTarget.select()}
                        onClick={(event) => event.currentTarget.select()}
                        className={`
                            h-14 w-12 rounded-2xl border border-gray-800
                            text-center text-3xl font-black text-white outline-none
                            ${digit
                                ? "bg-ungu/20 border-unguterang"
                                : "bg-[#171717] border-gray-800/80"
                            }`}
                    />
                ))}   
            </div>

            <div className="-mt-2">
                <button
                    type="button"
                    onClick={handlePaste}
                    disabled={busy}
                    className="
                        mx-auto flex items-center justify-center rounded-full font-semibold
                        bg-ungu/10 border border-unguterang/40 px-3 py-2 
                        text-unguterang tracking-tight text-sm cursor-pointer
                        active:text-unguterang/30 active:bg-dark/30 active:border-unguterang/30"
                >
                    <Clipboard className="mr-2 shrink-0 font-black" size={16} strokeWidth={2.5} />
                    Paste
                </button>
            </div>

            <button
                type="button"
                onClick={handleSubmit}
                disabled={busy}
                className="
                    flex items-center justify-center mx-auto mt-6 py-4 w-full bg-ungu rounded-2xl
                    text-white font-black tracking-wide cursor-pointer 
                    active:bg-ungu/40 active:text-white/40 disabled:opacity-40 disabled:cursor-default"
            >
                <CircleCheckBig className="mr-2 shrink-0" size={22} strokeWidth={3} />
                {loading ? "Memverifikasi..." : "Verifikasi Lanjut"}
            </button>

            <div>
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={busy || remaining > 0}
                    aria-describedby="resend-timer"
                    className="flex justify-center items-center mx-auto mt-8 text-white font-bold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-default"
                >
                    {resending ? "Mengirim..." : <>Kirim ulang <span className="ml-1 text-unguterang font-black">Kode OTP</span></>}
                </button>
                <p id="resend-timer" className="mt-2 text-center text-sm text-white/60">
                    {remaining > 0
                        ? `Kirim ulang tersedia dalam ${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`
                        : "Belum menerima email? Kamu bisa kirim ulang sekarang."}
                </p>
                {successMessage && <p role="status" className="mt-3 text-center text-sm text-unguterang">{successMessage}</p>}
            </div>
            {errorMessage && <ErrorPopUp message={errorMessage} onClose={() => setErrorMessage("")} />}
        </div>
    )
}
