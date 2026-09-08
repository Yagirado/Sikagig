import { User } from "lucide-react";

export default function NamaLengkap(){
    return(
        <div className="group flex flex-col gap-1 mt-5 sm:mt-2">
            <p className="text-sm font-black uppercase group-focus-within:text-unguterang">
                Nama Lengkap
            </p>
            <label 
                className="
                        flex items-center cursor-text bg-dark border-[1.5px] border-gray-600 px-2 py-4 rounded-2xl
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
    )
}