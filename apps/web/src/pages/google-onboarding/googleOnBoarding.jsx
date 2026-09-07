import { ArrowLeft, CircleCheckBig } from "lucide-react";
import { Link } from "react-router";
import Nim from "../register/nim";
import NamaLengkap from "../register/namaLengkap";
import Email from "../register/email";
import Nphone from "../register/nphone";
import Gender from "../register/gender";
import TanggalLahir from "../register/tanggalLahir";
import Aggrement from "../register/aggrement";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

export default function GoogleOnBoarding(){
    const [legalySetuju, setLegalySetuju] = useState(false);
    const [privacySetuju, setPrivacySetuju] = useState(false);
    const lanjut = privacySetuju && legalySetuju; 

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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2D2320]">
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
                            Email nugrahaadani@gmail.com otomatis digunakan.
                        </p>
                    </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                    {["Nomor HP", "Gender", "Tanggal Lahir"].map((label) => (
                        <span
                            key={label}
                            className="rounded-full bg-[#2D2320] px-3 py-2 text-xs font-bold text-white/90"
                        >
                            {label}
                        </span>
                    ))}
                </div>
            </div>

            <form className="flex flex-col mt-5 gap-2 pb-28 sm:gap-6 text-white/70">
                <Nim />

                <NamaLengkap />
                
                <Email />

                <Nphone />

                <Gender/>

                <TanggalLahir />

                <Aggrement 
                    legalySetuju={legalySetuju}
                    setLegalySetuju={setLegalySetuju}
                    privacySetuju={privacySetuju}
                    setPrivacySetuju={setPrivacySetuju}
                />
            </form>

            <footer className="fixed bottom-0 left-1/2 z-50 w-full max-w-107.5 -translate-x-1/2 bg-dark px-6 py-4">
                <button 
                    type="submit"
                    disabled={!lanjut}
                    className="
                    flex items-center justify-center w-full rounded-2xl 
                    bg-unguterang px-4 py-4 font-black text-white
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