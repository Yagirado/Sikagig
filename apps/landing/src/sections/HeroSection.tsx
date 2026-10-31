import TypewriterText from '../components/TypewriterText'

type ContohGigProps = {
        title: string,
        gigType: string,
        fee: number,
        person?: 'per orang' 
        rotateClass?: string
    }

function ContohGig( {
            title,
            gigType,
            fee,
            person,
            rotateClass,
            }: ContohGigProps){
                    
    return (
        <div className={`
                mt-4 flex flex-col gap-3 rounded-2xl bg-white px-4 py-3
                border border-black/15 shadow-[3px_4px_0_#BFC9D1]
                sm:mt-5 sm:flex-row sm:items-start sm:justify-between sm:px-5 ${rotateClass}`}>
            <div>
                <h2 className="text-base font-bold text-black sm:text-lg">
                    {title}
                </h2>
                
                <p className="text-sm text-gray-600 font-semibold sm:text-base">
                    {gigType}
                </p>
            </div>

            <div className="w-fit shrink-0 rounded-full bg-black px-4 py-1 text-xs font-bold text-white">
                <span>
                    Rp {fee.toLocaleString('id-ID')}
                    {person && ` ${person}`}
                </span> 
            </div>
        </div>
    )
}      

export default function HeroSection(){
    const TYPEWRITER_WORDS = [
                            'joki tugas?',
                            'beliin barang?',
                            'nyari tebengan?',
                            'antriin yang viral?',
                            'beliin makan?',
                            'gantiin COD-an?',
                            ]
    

    return (
        <section className="hero-enter min-w-0 overflow-hidden pt-0">

            <div className="mx-auto h-[1.5px] w-[calc(100%-2rem)] max-w-6xl bg-white/20 sm:w-[calc(100%-3rem)]" />

            <p className="mx-auto mt-8 max-w-7xl px-4 text-left text-xs font-semibold uppercase text-[#A685E2] sm:mt-10 sm:px-6 sm:text-sm lg:px-8">
                Cari sika. Ambil gig. Beresin kerjaan.
            </p>

            <div
            className="
                mx-auto mt-3 grid max-w-7xl grid-cols-1 items-start gap-8 px-4
                sm:px-6 lg:grid-cols-[54fr_46fr] lg:px-8"
            >
                {/* Bagian kiri */}
                <div className="min-w-0 self-start">
                    <h1 className="
                            text-4xl font-bold leading-[0.98] tracking-normal
                            sm:text-5xl md:text-6xl lg:text-8xl lg:leading-[0.9]"
                    >
                        <span className="mb-2 block sm:mb-3">
                            Lagi butuh
                        </span>

                        <div className="relative overflow-hidden">
                            {/* Menyediakan ruang sesuai teks terpanjang */}
                            <span
                                aria-hidden="true"
                                className="invisible block text-[#7F55B1]"
                            >
                                antriin yang viral?|
                            </span>

                            <TypewriterText
                                words={TYPEWRITER_WORDS}
                                typingSpeed={80}
                                deletingSpeed={40}
                                pauseDuration={1200}
                                className="absolute inset-0 block text-[#A685E2]"
                            />
                        </div>
                    </h1>

                        <p className="mt-6 max-w-2xl text-base leading-relaxed text-gray-200 sm:mt-8 sm:text-lg lg:mt-10">
                            Posting kerjaanmu, puluhan sika siap ambil dalam hitungan menit. 
                            Bayar lewat escrow — dana baru cair ke sika kalau hasilnya udah kamu setujui. 
                            Aman, cepat, tanpa ribet.
                        </p>

                        <a 
                            href="https://app.sikagig.me"
                            className="
                                mt-7 inline-flex w-full items-center justify-center
                                rounded-2xl bg-[#7F55B1] px-8 py-4 
                                font-bold text-white text-base
                                shadow-[3px_4px_0_#000]
                                transition-all duration-300 ease-out
                                hover:-translate-y-1
                                hover:bg-[#9B7EBD]
                                hover:shadow-[4px_5px_0_#000]
                                active:translate-x-0.75
                                active:translate-y-1
                                active:shadow-none
                                sm:mt-8 sm:w-auto sm:px-10 sm:py-5 sm:text-lg"
                        >
                            Buka Sikagig
                        </a>

                        <div
                            className="
                            mt-7 grid grid-cols-1 items-start gap-3
                            text-sm leading-relaxed text-gray-200
                            sm:mt-8 sm:grid-cols-2 sm:gap-4 sm:text-[15px]
                            "
                        >
                            <div className="space-y-3 sm:space-y-4">
                            <p>
                                <strong className="font-black text-white">KYC opsional</strong>
                                {' '}dengan badge verified
                            </p>

                            <p>
                                <strong className="font-black text-white">Langsung mulai</strong>
                                {' '}cari atau posting gig
                            </p>
                            </div>

                            <p>
                            <strong className="font-black text-white">Escrow</strong>
                            {' '}untuk bantu amankan pembayaran
                            </p>
                    </div>

                </div>

                {/* Bagian kanan */}
                <aside className="
                        relative mt-2 h-fit min-w-0 self-start rounded-2xl bg-[#FFE6E6] p-4
                        shadow-[4px_5px_0] shadow-black sm:p-6
                        lg:mt-0 lg:rounded-3xl lg:p-7 lg:shadow-[7px_7px_0]">
                    <div className="flex flex-col gap-3 border-b border-black/20 pb-5 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase text-gray-600 sm:text-sm">
                                contoh gig
                            </p>
                            
                            <h2 className="mt-1 text-lg text-black font-semibold sm:text-xl">
                                Yang bisa kamu temuin
                            </h2>
                        </div>
                        
                        <div className="w-fit rounded-full bg-[#7F55B1]">
                            <span 
                                className="
                                    shrink-0 rounded-full bg-[#7F55B1]
                                    px-4 py-1.5 text-sm font-bold text-white
                                    shadow-[2.5px_2.5px_0_#333]"
                            >
                                aktif
                            </span>
                        </div>
                    </div>

                    <ContohGig 
                        title="Jokiin tugas statistika"
                        gigType="tugas"
                        fee={10_000}
                    />

                    <ContohGig 
                        title="Isiin quisioner butuh cepet"
                        gigType="riset"
                        fee={2_500}
                        person="per orang"
                        rotateClass="-rotate-1"
                    />

                    <ContohGig 
                        title="Gantiin COD-an depan mahkota"
                        gigType="suruh orang"
                        fee={5_000}
                        rotateClass="rotate-1"
                    />

                    <div className="mt-6 rounded-2xl bg-[#091413] p-4 sm:mt-7 sm:p-5">
                        <h2 className="text-sm font-bold text-white">
                            Detail yang jelas bikin kerjaan lebih gampang selesai.
                        </h2>
                        <p className="text-xs text-gray-400 mt-3">
                            Tulis tugas, budget, deadline, dan bukti yang dibutuhkan dari awal biar sika paham sebelum ambil gig.
                        </p>
                    </div>

<div 
    className="
        hidden rounded-full bg-yellow-400 px-5 py-3
        shadow-[4px_6px_0] shadow-black/70
        lg:absolute lg:-bottom-6 lg:-left-4 lg:z-20 lg:inline-flex
    "
>
    <p className="text-sm font-bold text-black">
        Yuk join jadi sika sekarang juga!!!
    </p>
</div>

                </aside>
            </div>
        </section>
    )
}
