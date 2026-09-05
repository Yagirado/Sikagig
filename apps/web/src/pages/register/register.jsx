import { ArrowLeft, IdCard, User, Mail, Phone, Mars, Venus, Shield } from 'lucide-react';
import { Link } from 'react-router';
import TanggalLahir from './tanggalLahir';
import { useState } from 'react';

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
                <div className="group flex flex-col gap-1 -mt-1">
                    <p className="text-sm font-black uppercase group-focus-within:text-ungu">
                        NIM
                    </p>
                    <label 
                        className="
                                flex items-center cursor-text bg-gray-800 border-[1.5px] border-gray-600 px-2 py-4 rounded-2xl
                                focus-within:border-ungu focus-within:[&>svg]:text-white"
                    >
                        <IdCard className="text-gray-400 shrink-0 mx-2" size={24} />
                        <input 
                            type="text"
                            name="NIM"
                            inputMode="numeric"
                            pattern="[0-9]{13}"
                            maxLength={13}
                            placeholder="241063xxxxxxx"
                            className="flex-1 bg-transparent cursor-text outline-none placeholder:text-gray-400 "
                            required
                            onInput={(e) => {
                                e.currentTarget.value = e.currentTarget.value
                                .replace(/\D/g, "")
                                .slice(0, 13);
                            }}
                        />
                    </label>
                </div>

                <div className="group flex flex-col gap-1 mt-5 sm:mt-2">
                    <p className="text-sm font-black uppercase group-focus-within:text-ungu">
                        Nama Lengkap
                    </p>
                    <label 
                        className="
                                flex items-center cursor-text bg-gray-800 border-[1.5px] border-gray-600 px-2 py-4 rounded-2xl
                                focus-within:border-ungu focus-within:[&>svg]:text-white"
                    >
                        <User className="text-gray-400 shrink-0 mx-2" size={24} />
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Nama lengkap"
                            autoComplete="name"
                            className="flex-1 bg-transparent cursor-text outline-none placeholder:text-gray-400 "
                            required
                        />
                    </label>
                </div>
                
                <div className="group flex flex-col gap-1 mt-5 sm:mt-2">
                    <p className="text-sm font-black uppercase group-focus-within:text-ungu">
                        Email
                    </p>
                    <label 
                        className="
                                flex items-center cursor-text bg-gray-800 border-[1.5px] border-gray-600 px-2 py-4 rounded-2xl
                                focus-within:border-ungu focus-within:[&>svg]:text-white"
                    >
                        <Mail className="text-gray-400 shrink-0 mx-2" size={24} />
                        <input
                            type="email"
                            name="email"
                            placeholder="email@kamu.com"
                            autoComplete="email"
                            className="flex-1 bg-transparent cursor-text outline-none placeholder:text-gray-400 "
                            required
                        />
                    </label>
                </div>

                <div className="group flex flex-col gap-1 mt-5 sm:mt-2">
                    <p className="text-sm font-black uppercase group-focus-within:text-ungu">
                        Nomor HP
                    </p>
                    <label 
                        className="
                                flex items-center cursor-text bg-gray-800 border-[1.5px] border-gray-600 px-2 py-4 rounded-2xl
                                focus-within:border-ungu focus-within:[&>svg]:text-white"
                    >
                        <Phone className="text-gray-400 shrink-0 mx-2" size={24} />
                        <input
                            type="tel"
                            name="phone"
                            placeholder="08xxxxxxxxxx"
                            autoComplete="tel"
                            inputMode="tel"
                            className="flex-1 bg-transparent cursor-text outline-none placeholder:text-gray-400 "
                            required
                        />
                    </label>
                </div>

                <div className="flex flex-col gap-1 mt-5 sm:mt-2">
                    <p className="text-sm font-black uppercase">
                        Gender
                    </p>
                    <div className="flex justify-center items-center gap-4 mt-1">
                        <label 
                            className="
                                flex justify-center items-center w-full cursor-text bg-gray-800 
                                border-[1.5px] border-gray-600 px-2 py-3 rounded-2xl
                                has-checked:border-ungu has-checked:bg-ungu/20"
                        >
                            <input
                                type="radio"
                                name="gender"
                                value="man"
                                className="sr-only peer"
                                required
                            />
                            <Mars className="text-white shrink-0 mr-1 peer-checked:text-ungu" size={22} />
                            <span className="text-sm font-semibold peer-checked:text-ungu peer-checked:font-semibold peer-focus-visible:outline">
                                Cowok
                            </span>
                        </label>

                        <label 
                            className="
                                flex justify-center items-center w-full cursor-text bg-gray-800 
                                border-[1.5px] border-gray-600 px-2 py-3 rounded-2xl
                                has-checked:border-ungu has-checked:bg-ungu/20"
                        >
                            <input
                                type="radio"
                                name="gender"
                                value="woman"
                                className="sr-only peer"
                            />
                            <Venus className="text-white shrink-0 mr-1 peer-checked:text-ungu" size={22} />
                            <span className="text-sm font-semibold peer-checked:text-ungu peer-checked:font-semibold peer-focus-visible:outline">
                                Cewek
                            </span>
                        </label>
                    </div>
                </div>

                <TanggalLahir />

                <div className="flex flex-col gap-3 mt-5 pb-5 sm:mt-2">
                    <p className="text-sm font-black uppercase -mb-2">
                        Persetujuan
                    </p>
                    <label
                        className="
                            flex items-start gap-3 w-full cursor-pointer select-none
                            bg-gray-800 border-[1.5px] border-gray-600
                            px-4 py-3 rounded-2xl
                            has-checked:border-ungu has-checked:bg-ungu/20"
                    >
                        <input
                            type="checkbox"
                            name="legal_agreement"
                            value="accepted"
                            checked={legalySetuju}
                            onChange={(e) => setLegalySetuju(e.target.checked)}
                            required
                            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-ungu"
                        />

                        <span className="text-xs leading-5">
                            Saya setuju menggunakan Sikagig untuk aktivitas yang legal dan
                            tidak melanggar hukum/aturan yang berlaku (termasuk bukan untuk
                            prostitusi, pornografi, SARA, perjudian, narkoba, penipuan, atau
                            konten terlarang lainnya).
                        </span>
                    </label>

                    <label
                        className="
                            flex items-start gap-3 w-full cursor-pointer select-none
                            bg-gray-800 border-[1.5px] border-gray-600
                            px-4 py-3 rounded-2xl
                            has-checked:border-ungu has-checked:bg-ungu/20"
                    >
                        <input
                            type="checkbox"
                            name="privacy_agreement"
                            value="accepted"
                            checked={privacySetuju}
                            onChange={(e) => setPrivacySetuju(e.target.checked)}
                            required
                            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-ungu"
                        />

                        <span className="text-xs leading-5">
                            Saya setuju dengan{" "}
                            <a 
                                href="https://sikagig.vercel.app/privacy" 
                                className="text-ungu underline"
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                Privacy Policy
                            </a>{" "}
                            Sikagig.
                        </span>
                    </label>
                </div>
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
