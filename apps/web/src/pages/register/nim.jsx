import { IdCard } from "lucide-react";

export default function Nim(){
    return(
        <div className="group flex flex-col gap-1 -mt-1">
            <p className="text-sm font-black uppercase group-focus-within:text-unguterang">
                NIM
            </p>
            <label 
                className="
                        flex items-center cursor-text bg-dark border-[1.5px] border-gray-600 px-2 py-4 rounded-2xl
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
    )
}