import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router';
import TanggalLahir from './tanggalLahir';
import { useState } from 'react';
import Nim from './nim';
import NamaLengkap from './namaLengkap';
import Email from './email';
import Gender from './gender';
import Nphone from './nphone';
import Aggrement from './aggrement';

export default function Register() {
    const [legalySetuju, setLegalySetuju] = useState(false);
    const [privacySetuju, setPrivacySetuju] = useState(false);
    const lanjut = privacySetuju && legalySetuju; 

    return(
        <div className="mobile-container py-0!">
            <header className="sticky top-0 z-50 -mx-6 mb-6 bg-[#151515] px-6 pt-10 pb-4">
                <div className="relative flex h-11 items-center text-white">
                    <Link
                        to="/login"
                        className="
                        group absolute left-0 flex h-11 w-11 items-center justify-center rounded-full
                        border border-gray-800 bg-dark
                        active:border-gray-800/20 active:bg-dark/60
                        "
                    >
                        <ArrowLeft size={24} className="text-white group-active:text-white/20" />
                    </Link>

                    <h2 className="w-full text-center text-base font-black">
                        Buat Profil
                    </h2>
                </div>
            </header>

            <form className="flex flex-col gap-2 pb-28 sm:gap-6 text-white/70">
                <Nim />

                <NamaLengkap/>
                
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
                    bg-ungu px-4 py-4 font-black text-white
                    enabled:active:bg-ungu/80 enabled:active:text-white/80
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Shield className="text-white shrink-0 mr-1" size={24} />
                    <span>Lanjut Verifikasi</span>
                </button>
            </footer>
        </div>
    )
}
