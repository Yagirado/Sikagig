import { Mail } from "lucide-react";

export default function Email(){
    return(
        <div className="group flex flex-col gap-1 mt-5 sm:mt-2">
            <p className="text-sm font-black uppercase group-focus-within:text-unguterang">
                Email
            </p>
            <label 
                className="
                        flex items-center cursor-text bg-dark border-[1.5px] border-gray-600 px-2 py-4 rounded-2xl
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
    )
}