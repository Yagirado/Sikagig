import { Mars, Venus } from "lucide-react";

export default function Gender(){
    return(
        <div className="flex flex-col gap-1 mt-5 sm:mt-2">
            <p className="text-sm font-black uppercase">
                Gender
            </p>
            <div className="flex justify-center items-center gap-4 mt-1">
                <label 
                    className="
                        flex justify-center items-center w-full cursor-text bg-dark 
                        border-[1.5px] border-gray-600 px-2 py-3 rounded-2xl
                        has-checked:border-ungu has-checked:bg-ungu/20"
                >
                    <input
                        type="radio"
                        name="gender"
                        value="man"
                        className="sr-only peer"
                        required
                    />
                    <Mars className="text-white shrink-0 mr-1 peer-checked:text-ungu" size={22} />
                    <span className="text-sm font-semibold peer-checked:text-ungu peer-checked:font-semibold peer-focus-visible:outline">
                        Cowok
                    </span>
                </label>

                <label 
                    className="
                        flex justify-center items-center w-full cursor-text bg-dark 
                        border-[1.5px] border-gray-600 px-2 py-3 rounded-2xl
                        has-checked:border-ungu has-checked:bg-ungu/20"
                >
                    <input
                        type="radio"
                        name="gender"
                        value="woman"
                        className="sr-only peer"
                    />
                    <Venus className="text-white shrink-0 mr-1 peer-checked:text-ungu" size={22} />
                    <span className="text-sm font-semibold peer-checked:text-ungu peer-checked:font-semibold peer-focus-visible:outline">
                        Cewek
                    </span>
                </label>
            </div>
        </div>
    )
}