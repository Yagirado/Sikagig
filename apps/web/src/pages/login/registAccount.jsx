import { useEffect, useState } from "react";
import { Link } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { Mail } from "lucide-react";

export default function RegistAccount(){
    const [ShowMethod, setShowMethod] = useState(false);

    useEffect (() => {
        if (ShowMethod) {
            document.body.style.overflow = "hidden";
        }else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    },[ShowMethod])
    
    return(
    <div>
        <p 
            onClick={() => setShowMethod(!ShowMethod)}
            className="text-ungu font-black cursor-pointer"
        >
            Daftar dulu di sini
        </p>

        {ShowMethod && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="w-[85%] max-w-[355px] rounded-2xl bg-[#151515] py-5 px-5 text-white  border border-gray-700">
                    <h2 className="mb-4 text-2xl font-black">
                        Daftar akun
                    </h2>

                    <p className="flex items-center justify-center mb-4 text-sm">
                        Pilih metode daftar yang kamu mau. Email lanjut ke form lengkap, atau daftar cepat pakai Google.
                    </p>

                    <div className="flex items-center justify-center rounded-2xl bg-ungu active:bg-ungu/70 ">
                        <Link
                            to="/register"
                            className="flex items-center justify-center w-full font-black text-base gap-2 px-2 py-4 cursor-pointer"
                        >
                            <Mail className="text-white shrink-0" size={20}  />
                            Daftar pakai Email  
                        </Link>
                    </div>

                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-gray-700" />
                        <span className="text-gray-400 text-xs font-black tracking-widest">ATAU</span>
                        <div className="flex-1 h-px bg-gray-700" />
                    </div>

                    <div className="flex flex-col justify-center items-center">
                        <button className="
                            flex w-full items-center justify-center rounded-2xl bg-dark text-base font-black
                            border border-gray-700 px-2 py-4 cursor-pointer active:text-white/70"
                        >
                            <FontAwesomeIcon icon={faGoogle} className="mr-2 shrink-0 text-[#EA4335]" />
                            Daftar dengan Google
                        </button>

                        <p 
                            onClick={() => setShowMethod(!ShowMethod)}
                            className="w-fit flex items-center justify-center mt-8 mb-5 text-sm font-black cursor-pointer active:text-white/70"
                        >
                            Batal
                        </p>
                    </div>
                </div>
            </div>
        )}
    </div>
)
}