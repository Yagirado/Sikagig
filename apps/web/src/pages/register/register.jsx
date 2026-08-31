import { ArrowLeft, IdCard, User, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router';

export default function Register() {
    return(
        <div className="mobile-container !py-0">
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

            <form className="flex flex-col gap-2 sm:gap-6 text-white">
                <div className="flex flex-col gap-1 -mt-1">
                    <p className="text-sm font-black uppercase">
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

                <div className="flex flex-col gap-1 mt-8 sm:mt-1">
                    <p className="text-sm font-black uppercase">
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
                
                <div className="flex flex-col gap-1 mt-8 sm:mt-1">
                    <p className="text-sm font-black uppercase">
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

                <div className="flex flex-col gap-1 mt-8 sm:mt-1">
                    <p className="text-sm font-black uppercase">
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

                <div>
                    <p>Gender</p>
                </div>

                <div>

                </div>
            </form>

            <footer className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 bg-[#151515] px-6 py-4">
                <button className="w-full rounded-2xl bg-ungu px-4 py-4 font-black text-white">
                    Lanjut
                </button>
            </footer>
        </div>
    )
}
