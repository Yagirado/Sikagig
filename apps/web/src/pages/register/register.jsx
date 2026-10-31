import { ArrowLeft, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import TanggalLahir from '../../components/loginMod/tanggalLahir';
import { useState } from 'react';
import Nim from '../../components/loginMod/nim';
import NamaLengkap from '../../components/loginMod/namaLengkap';
import Email from '../../components/email';
import Gender from '../../components/loginMod/gender';
import Nphone from '../../components/loginMod/nphone';
import Aggrement from '../../components/loginMod/aggrement';
import { getCsrfToken } from '../../lib/api';
import ErrorPopUp from '../../components/loginMod/errorPopUp';
import { registrationFormError, registrationResponseError } from '../../lib/registrationErrors';
import { retryDeadline } from '../../lib/otp';

export default function Register() {
    const navigate = useNavigate();
    const [nim, setNim] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [gender, setGender] = useState("");
    const [phone, setPhone] = useState("");
    const [tanggalLahir, setTanggalLahir] = useState("");
    const [legalySetuju, setLegalySetuju] = useState(false);
    const [privacySetuju, setPrivacySetuju] = useState(false);
    const lanjut = privacySetuju && legalySetuju;
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    function handleInvalid(event) {
        event.preventDefault();
        setErrorMessage(registrationFormError(event.currentTarget));
    }

    async function handleSubmit(event){
        event.preventDefault();

        if (loading) return;
        
        const formError = registrationFormError(event.currentTarget);
        
        if (formError) {
            setErrorMessage(formError);
            return;
        }
        if (!legalySetuju || !privacySetuju) {
            setErrorMessage("Ketentuan penggunaan dan kebijakan privasi wajib disetujui sebelum melanjutkan.");
            return;
        }
        setLoading(true);
        setErrorMessage("");

        const formData = new FormData(event.currentTarget);

        const payload = {
            NIM: formData.get("NIM"),
            fullName: formData.get("fullName"),
            email: String(formData.get("email") ?? "").trim(),
            phone: formData.get("phone"),
            gender,
            tanggal_lahir: tanggalLahir,
            legal_agreement: legalySetuju,
            privacy_agreement: privacySetuju,
        }

        try {
            const csrfToken = await getCsrfToken();

            const response = await fetch("/api/auth/register/request-otp", {
                method: "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            
            if(!response.ok){
                throw new Error(registrationResponseError(data));
            }

            navigate("/otp", {
                state: {
                    challengeId: data.challenge_id,
                    email: payload.email,
                    flow: "register", 
                    registrationPayload: payload,
                    resendAvailableAt: retryDeadline(data.retry_after),
                },
            });
        } catch (error) {
            setErrorMessage(error.message ?? "Terjadi kesalahan.");
        } finally {
            setLoading(false);
        }
    }

    return(
        <div className="mobile-container py-0!">
            <header className="sticky top-0 z-50 -mx-6 mb-6 bg-[#151515] px-6 pt-10 pb-4">
                <div className="relative flex h-11 items-center text-white">
                    <Link
                        to="/login"
                        className="
                            group absolute left-0 flex h-11 w-11 items-center justify-center rounded-full
                            border border-gray-800 bg-dark
                            active:border-gray-800/40 active:bg-dark/40"
                        draggable={false}
                    >
                        <ArrowLeft size={24} className="shrink-0 text-white group-active:text-white/40" />
                    </Link>

                    <h2 className="w-full text-center text-base font-black">
                        Buat Profil
                    </h2>
                </div>
            </header>

            <form
                id="register-form"
                onSubmit={handleSubmit}
                onInvalid={handleInvalid}
                className="flex flex-col gap-2 pb-28 sm:gap-6 text-white/70"
            >
                <Nim 
                    nim = {nim}
                    setNim = {setNim}
                />

                <NamaLengkap
                    fullName = {fullName}
                    setFullName = {setFullName}
                />
                
                <Email 
                    email = {email}
                    setEmail = {setEmail}
                />

                <Nphone 
                    phone = {phone}
                    setPhone = {setPhone}
                />

                <Gender
                    gender = {gender}
                    setGender = {setGender}
                />

                <TanggalLahir 
                    tanggalLahir = {tanggalLahir}
                    setTanggalLahir = {setTanggalLahir}
                    setErrorMessage={setErrorMessage}
                />

                <Aggrement 
                    legalySetuju={legalySetuju}
                    setLegalySetuju={setLegalySetuju}
                    privacySetuju={privacySetuju}
                    setPrivacySetuju={setPrivacySetuju}
                />
            </form>

            {errorMessage && (
                <ErrorPopUp 
                    message={errorMessage}
                    onClose={() => setErrorMessage("")}
                />
            )}

            <footer className="fixed bottom-0 left-1/2 z-50 w-full max-w-107.5 -translate-x-1/2 bg-dark px-6 py-4">
                <button 
                    type="submit"
                    form="register-form"
                    disabled={!lanjut || loading}
                    className="
                        flex items-center justify-center w-full rounded-2xl 
                        bg-unguterang px-4 py-4 font-black text-white cursor-pointer
                        enabled:active:bg-ungu/80 enabled:active:text-white/80
                        disabled:opacity-40 disabled:cursor-default"
                >
                    <Shield className="shrink-0 mr-1 text-current" size={24} />
                    <span>
                        {loading ? "Mengirim OTP..." : "Lanjut Verifikasi"}
                    </span>
                </button>
            </footer>
        </div>
    )
}
