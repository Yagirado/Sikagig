import { ArrowLeft } from 'lucide-react';
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

            <form className="h-220 bg-white pb-24">
                <p>halo dunia</p>
            </form>

            <footer className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 bg-[#151515] px-6 py-4">
  <button className="w-full rounded-2xl bg-ungu px-4 py-4 font-black text-white">
    Lanjut
  </button>
</footer>
        </div>
    )
}
