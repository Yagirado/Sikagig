export default function Aggrement({ legalySetuju, setLegalySetuju, privacySetuju, setPrivacySetuju}){
    return(
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
    )
}