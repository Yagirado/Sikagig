import { Phone } from "lucide-react";

export default function Nphone(){
    return(
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
    )
}