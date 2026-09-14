import logo from "../../assets/logo.png"
import { Mail, Send } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import RegistAccount from "./registAccount";
import { useNavigate } from "react-router";
import { getCsrfToken } from "../../lib/api";
import { useState } from "react";
import ErrorPopUp from "../../components/errorPopUp";
import { retryDeadline } from "../../lib/otp";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [showRegister, setShowRegister] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        if (loading) return;

        setLoading(true);
        setErrorMessage("");

        try {
            const csrfToken = await getCsrfToken();

            const response = await fetch("/api/auth/request-otp", {
                method: "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "x-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({
                    email: email.trim(),
                }),
            });

            const data = await response.json();

            if(!response.ok){
                const emailBelumTerdaftar = response.status === 422;

                if(emailBelumTerdaftar) return setShowRegister(true);
                throw new Error(data.message ?? "Gagal mengirim OTP.");
            }

            navigate("/otp", {
                state: {
                    challengeId: data.challenge_id,
                    email: email.trim(),
                    flow: "login",
                    resendAvailableAt: retryDeadline(data.retry_after),
                },
            });
        } catch (error) {
            setErrorMessage(error.message ?? "Terjadi kesalahan.");
        } finally {
            setLoading(false);
        }
    }

    function handleSubmitGoogle(event) {
        event.preventDefault();
        // Pratinjau frontend; pengiriman OTP akan dihubungkan ke backend nanti.
        navigate("/google");
    }

    return(
        <div className="mobile-container text-white">
            <div className="flex flex-col items-start gap-6">
                <div>
                    <img 
                        src={logo} 
                        alt="Logo" 
                        className="h-13 w-auto pointer-events-none select-none"
                        loading="eager"
                        draggable={false}
                    />
                </div>
                <div className="flex flex-col gap-4">
                    <h2 className="font-black text-4xl text-unguterang">
                        Masuk
                    </h2>
                    <p className="text-sm">
                        Masukan Email Anda dan kami akan mengirimkan kode OTP untuk verifikasi.
                    </p>
                </div>
            </div>

            <form 
                id="login-form"
                onSubmit={handleSubmit}
                className="flex flex-col gap-6 my-8 sm:my-4"
            >
                <div className="group flex flex-col gap-1 mt-8 sm:mt-1">
                    <span className="font-black uppercase text-white/70 group-focus-within:text-unguterang">
                        Email
                    </span>
                    <label className="cursor-text">
                        <span
                            className="
                            flex items-center bg-dark border-[1.5px]
                            border-gray-600 px-2 py-4 rounded-2xl
                            focus-within:border-ungu focus-within:[&>svg]:text-white
                            "
                        >
                            <Mail className="text-gray-400 shrink-0 mx-2" size={20} />

                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                onInvalid={(event) => {
                                    event.preventDefault();

                                    setErrorMessage(
                                        event.currentTarget.validity.valueMissing
                                            ? "Email wajib diisi."
                                            : "Format email tidak valid. contoh: nama@gmail.com"
                                    );
                                }}
                                placeholder="email@kamu.com"
                                required
                                className="flex-1 min-w-0 bg-transparent cursor-text outline-none placeholder:text-gray-400"
                            />
                        </span>
                    </label>
                </div>

                {errorMessage && (
                    <ErrorPopUp 
                        message={errorMessage}
                        onClose={() => setErrorMessage("")}
                    />
                )}

                <div className="overflow-hidden rounded-2xl bg-unguterang">
                    <button
                        type="submit"
                        disabled={loading}
                        className="
                            flex w-full items-center justify-center
                            px-2 py-4 text-base font-black text-white cursor-pointer
                            active:bg-black/40 active:text-white/40">
                        <Send className="shrink-0 mr-2 text-current" size={20} />
                        {loading ? "Mengirim OTP..." : "kirim kode OTP"}
                    </button>
                </div>
            </form>

            <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-gray-400 text-xs font-bold tracking-widest">ATAU</span>
                <div className="flex-1 h-px bg-gray-700" />
            </div>

            <div className="flex justify-center items-center">
                <button
                    type="button"
                    onClick={handleSubmitGoogle}
                    className="
                        group flex w-full items-center justify-center rounded-2xl bg-dark 
                        border border-gray-700 px-2 py-4 font-black cursor-pointer
                        active:bg-dark/40 active:text-white/70"
                >
                    <FontAwesomeIcon icon={faGoogle} className="mr-2 shrink-0 text-[#EA4335] group-active:text-[#EA4335]/70" />
                    Lanjut dengan Google
                </button>
            </div>

            <div className="mt-20 sm:mt-12 flex items-center justify-center gap-4 rounded-2xl bg-dark p-4">
                <div className="flex flex-col items-center text-center">
                    <div className="flex flex-wrap justify-center">
                        <p className="mr-1">
                            Belum punya akun?
                        </p> 
                        <RegistAccount
                            showRegister={showRegister}
                            setShowRegister={setShowRegister} 
                        />
                    </div>

                    <p className="mt-4 text-xs">
                        Dengan masuk, kamu setuju dengan
                        <a 
                            href="https://sikagig.vercel.app/privacy" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            draggable={false}
                            className="mx-1 underline"
                        >
                            kebijakan privasi
                        </a>
                        dan
                        <a
                            href="https://sikagig.vercel.app/terms" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            draggable={false}
                            className="mx-1 underline"
                        >
                            ketentuan penggunaan
                        </a>
                        kita.
                    </p>
                </div>
            </div>
        </div>
    )
}
