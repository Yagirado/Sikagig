import { ArrowLeft, CircleCheckBig } from "lucide-react";
import { Link, useNavigate } from "react-router";
import Nim from "../../components/nim";
import NamaLengkap from "../../components/namaLengkap";
import Email from "../../components/email";
import Nphone from "../../components/nphone";
import Gender from "../../components/gender";
import TanggalLahir from "../../components/tanggalLahir";
import Aggrement from "../../components/aggrement";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { registrationFormError } from "../../lib/registrationErrors";
import { getCsrfToken } from "../../lib/api";
import ErrorPopUp from "../../components/errorPopUp";

export default function GoogleOnBoarding(){
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
    const [googleProfile, setGoogleProfile] = useState({});

    useEffect(() => {
        const controller = new AbortController();

        async function loadGoogleDraft() {
            try {
                const response = await fetch("/api/auth/google/draft", {
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                    signal: controller.signal,
                });

                const data = await response.json();

                if(!response.ok){
                    throw new Error(
                        data.message ?? "Gagal Mengambil data pendaftaran Google."
                    );
                }

                if(controller.signal.aborted) return;

                if(window.opener && !window.opener.closed) {
                    window.opener.postMessage(
                        {
                            type: "google-register-ready",
                            needsEmailVerification: data.needs_email_verification === true,
                        },
                        window.location.origin
                    );

                    return;
                }

                const profile = data.profile ?? {};

                setGoogleProfile(profile);

                setNim(profile.NIM ?? "");
                setFullName(profile.fullName ?? "");
                setEmail(profile.email ?? "");
                setPhone(profile.phone ?? "");
                setGender(profile.gender ?? "");
                setTanggalLahir(profile.tanggal_lahir ?? "");
            } catch (error) {
                if(!controller.signal.aborted){
                    setErrorMessage(error.message ?? "Gagal mengambil data Google.");
                }
            }
        }

        loadGoogleDraft();
        return () => controller.abort();
    }, [])

    async function handleSubmit(event){
        event.preventDefault();

        if(loading) return;

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

        try {
            const csrfToken = await getCsrfToken();
            const response = await fetch("/api/auth/google/register", {
                method: "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({
                    NIM: nim,
                    fullName,
                    phone,
                    gender,
                    tanggal_lahir: tanggalLahir,
                    legal_agreement: legalySetuju,
                    privacy_agreement: privacySetuju,
                }),
            })

            const data = await response.json();

            if(!response.ok){
                const fieldError = Object.values(data.errors ?? {}).flat().find(Boolean);
                throw new Error(fieldError ?? data.message ?? "Pendaftaran gagal.");
            }

            navigate("/dashboard", {replace: true});
        } catch (error) {
            setErrorMessage(error.message ?? "Terjadi kesalahan.");
        } finally {
            setLoading(false);
        }
    }

    function handleInvalid(event) {
        event.preventDefault();
        setErrorMessage(registrationFormError(event.currentTarget));
    }

    return(
        <div className="mobile-container py-0!">
            <header className="sticky top-0 z-50 -mx-6 mb-6 bg-[#151515] px-6 pt-10 pb-4">
                <div className="flex items-start gap-3 text-white">
                    <Link
                        to="/login"
                        className="
                            group flex h-11 w-11 shrink-0 items-center justify-center rounded-full
                            border border-gray-800 bg-dark
                            active:border-gray-800/40 active:bg-dark/40"
                        draggable={false}
                    >
                        <ArrowLeft
                            size={24}
                            className="shrink-0 text-white group-active:text-white/40"
                        />
                    </Link>

                    <div className="min-w-0 flex-1">
                        <h2 className="text-base font-black">
                            Lengkapi Profil
                        </h2>
                        <p className="mt-1 text-xs text-white/70">
                            Google login butuh beberapa data tambahan.
                        </p>
                    </div>
                </div>
            </header>

            <div className="w-full rounded-3xl border border-white/10 bg-dark p-4 text-white">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-unguterang/20">
                        <FontAwesomeIcon
                            icon={faGoogle}
                            className="text-base text-[#EA4335]"
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-black">
                            Akun Google terhubung
                        </h2>
                        <p className="text-xs leading-relaxed wrap-break-words text-white/80">
                            Email {email} otomatis digunakan.
                        </p>
                    </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                    {[
                        {label: "Nama lengkap", value: googleProfile.fullName}, 
                        {label: "Email", value: googleProfile.email},
                        {label: "Nomor Hp", value: googleProfile.phone},
                        {label: "Gender", value: googleProfile.gender},
                        {label: "Tanggal Lahir", value: googleProfile.tanggal_lahir}
                    ]
                        .filter(({ value }) => value != null && String(value).trim() !== "")
                        .map(({ label }) => (
                        <span
                            key={label}
                            className="rounded-full bg-unguterang/20 px-3 py-2 text-xs font-bold text-white/90"
                        >
                            {label}
                        </span>
                    ))}
                </div>
            </div>

            <form
                id="google-register-form"
                onSubmit={handleSubmit}
                onInvalid={handleInvalid}
                className="flex flex-col mt-5 gap-2 pb-28 sm:gap-6 text-white/70"
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
                    readOnly
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
                    form="google-register-form"
                    disabled={!lanjut || loading}
                    className="
                    flex items-center justify-center w-full rounded-2xl 
                    bg-unguterang px-4 py-4 font-black text-white cursor-pointer
                    enabled:active:bg-ungu/80 enabled:active:text-white/80
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <CircleCheckBig className="shrink-0 mr-1 text-current" size={24} />
                    <span>Simpan dan Masuk</span>
                </button>
            </footer>
        </div> 
    )
}