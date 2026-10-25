import { useEffect, useState } from 'react';
import logo from '../assets/logo.png';

export default function Nav(){
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const links = [
        { href: "/#how-it-works", label: "Cara Kerja" },
        { href: "/#example", label: "Contoh Gig" },
        { href: "/#help", label: "Butuh bantuan?" },
        { href: "/#faq", label: "FAQ" },
    ]

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 15)
        }

        window.addEventListener("scroll", handleScroll, { passive: true })

        return () => {
            window.removeEventListener("scroll", handleScroll)
        }
    }, [])

    const closeMenu = () => setIsMenuOpen(false)

    return (
        <header className={`
            navbar-enter sticky top-0 z-50
            transition-colors duration-100 
            ${
                isScrolled || isMenuOpen
                    ? "bg-[#120F17]/80 shadow-lg shadow-black/20 backdrop-blur-md"
                    : "bg-transparent"
            }`}>
            <nav
                className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:pt-4"
                aria-label="Navigasi utama"
            >
                <a 
                    href="/" 
                    className="inline-flex shrink-0 items-center"
                    aria-label="kembali ke homepage"
                >
                    <img 
                        src={logo} 
                        alt="logo"
                        className="
                            h-12 w-auto object-contain transition-[filter] duration-300 sm:h-14 lg:h-16
                            hover:drop-shadow-[0_0_4px_rgba(168,85,247,0.9)]"
                    />
                </a>

                <button
                    type="button"
                    className="
                        inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15
                        bg-white/5 text-white transition-colors hover:bg-white/10 focus:outline-none
                        focus-visible:ring-2 focus-visible:ring-purple-300 lg:hidden
                    "
                    aria-label={isMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
                    aria-expanded={isMenuOpen}
                    aria-controls="primary-navigation"
                    onClick={() => setIsMenuOpen((open) => !open)}
                >
                    <span className="relative h-4 w-5" aria-hidden="true">
                        <span className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition-transform ${isMenuOpen ? "translate-y-1.75 rotate-45" : ""}`} />
                        <span className={`absolute left-0 top-1.75 h-0.5 w-5 rounded-full bg-current transition-opacity ${isMenuOpen ? "opacity-0" : "opacity-100"}`} />
                        <span className={`absolute left-0 top-3.5 h-0.5 w-5 rounded-full bg-current transition-transform ${isMenuOpen ? "-translate-y-1.75 -rotate-45" : ""}`} />
                    </span>
                </button>

                <div
                    id="primary-navigation"
                    className={`
                        w-full overflow-hidden transition-[max-height,opacity] duration-300 ease-out lg:flex lg:w-auto
                        lg:flex-1 lg:items-center lg:justify-end lg:gap-8 lg:overflow-visible lg:opacity-100
                        ${isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 lg:max-h-none"}
                    `}
                >
                    <ul className="flex flex-col gap-1 border-t border-white/10 py-3 text-sm font-medium lg:flex-row lg:items-center lg:gap-8 lg:border-0 lg:py-0 lg:text-base">
                        {links.map((link) => (
                            <li key={link.href}>
                                <a
                                    href={link.href}
                                    className="block rounded-xl px-3 py-2 transition-colors hover:bg-white/5 hover:text-purple-300 lg:px-0 lg:hover:bg-transparent"
                                    onClick={closeMenu}
                                >
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>

                    <a
                        href="https://app.sikagig.me"
                        className="
                            mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-[#7F55B1] px-5 py-2 font-bold
                            shadow-[3px_4px_0] shadow-black transition-[transform,background-color,box-shadow] duration-300 ease-out
                            hover:-translate-y-0.5 hover:bg-[#9B7EBD] hover:shadow-black lg:mt-0 lg:w-auto"
                        onClick={closeMenu}
                    >
                        Buka App
                    </a>
                </div>
            </nav>
        </header>
    )
}
