export default function Aggrement({ legalySetuju, setLegalySetuju, privacySetuju, setPrivacySetuju}){
    return(

        <div className="flex flex-col gap-3 mt-5 pb-5 sm:mt-2">
            <p className="text-sm font-black uppercase -mb-2">
                Persetujuan
            </p>
            <label
                className="
                    flex items-start gap-3 w-full cursor-pointer select-none
                    bg-dark border-[1.5px] border-gray-600
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
                    className=
                        "mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none
                        rounded border border-gray-600 bg-dark
                        checked:border-ungu checked:bg-ungu
                        bg-center bg-no-repeat
                        focus-visible:outline-2 focus-visible:outline-offset-2
                        focus-visible:outline-ungu"
                    style={{
                        backgroundImage: legalySetuju
                            ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3 8l3 3 7-7' fill='none' stroke='white' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
                            : "none",
                    }}
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
                    bg-dark border-[1.5px] border-gray-600
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
                    className=
                        "mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none
                        rounded border border-gray-600 bg-dark
                        checked:border-ungu checked:bg-ungu
                        bg-center bg-no-repeat
                        focus-visible:outline-2 focus-visible:outline-offset-2
                        focus-visible:outline-ungu"
                    style={{
                        backgroundImage: privacySetuju
                            ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3 8l3 3 7-7' fill='none' stroke='white' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
                            : "none",
                    }}
                />

                <span className="text-xs leading-5">
                    Saya setuju dengan{" "}
                    <a 
                        href="https://sikagig.vercel.app/privacy" 
                        className="text-unguterang font-semibold underline"
                        target="_blank" 
                        rel="noopener noreferrer"
                        draggable={false}
                    >
                        Privacy Policy
                    </a>{" "}
                    Sikagig.
                </span>
            </label>
        </div>
    )
}