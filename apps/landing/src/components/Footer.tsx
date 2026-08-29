import { Link } from 'react-router'
import logo from '../assets/logo.png'

export default function Footer(){
    return(
        <section className="border-t border-white/30 px-4 py-8 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-7xl flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
                <div className="flex items-center gap-2">
                    <img
                        src={logo}
                        alt="logo"
                        className="
                            h-10 w-auto object-contain transition-[filter] duration-300 sm:h-12
                            hover:drop-shadow-[0_0_1px_rgba(168,85,247,0.9)]"
                    />
                    <p className="text-xs text-white/40">&copy; 2026</p>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-4">
                    <Link
                        to="/privacy"
                        className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-2 text-xs text-white/60 transition-colors hover:text-white/80"
                    >
                        Kebijakan Privasi
                    </Link>

                    <Link
                        to="/terms"
                        className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-2 text-xs text-white/60 transition-colors hover:text-white/80"
                    >
                        Ketentuan Pengguna
                    </Link>

                    <a
                        href="https://instagram.com/nugrahaadanii"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-full border border-[#7F55B1] bg-[#7F55B1]/20 px-3 py-2 text-xs text-purple-400 transition-colors hover:bg-[#7F55B1]/60"
                    >
                        <i className="fa-brands fa-instagram"></i>
                        <p>Instagram</p>
                    </a>
                </div>
            </div>
        </section>
    )
}
