import { useRef } from "react";
import logo from "../../assets/logo.png"
import { Mail } from "lucide-react";

export default function Login() {
    const inputRef = useRef(null)

    return(
        <div className="mobile-container text-white">
            <div className="flex flex-col items-start gap-6">
                <div>
                    <img 
                        src={logo} 
                        alt="Logo" 
                        className="h-13 w-auto pointer-events-none select-none"
                        loading="eager"
                        draggable={false}
                    />
                </div>
                <div className="flex flex-col gap-4">
                    <h2 className="font-black text-4xl">
                        Masuk
                    </h2>
                    <p className="text-sm">
                        Masukan Email Anda dan kami akan mengirimkan kode OTP untuk verifikasi.
                    </p>
                </div>
            </div>

            <form 
                action="" 
                className="flex flex-col gap-6 my-6"
            >
                <div
                    onClick={() => inputRef.current?.focus()} 
                    className="flex flex-col focus-within:text-ungu gap-1"
                >
                    <p className="font-black">
                        Email
                    </p>
                    <div
                        
                        className="
                            flex items-center cursor-text bg-gray-800 border border-gray-600 px-2 py-4 rounded-2xl
                            focus-within:border-ungu focus-within:[&>svg]:text-white"
                    >
                        <Mail className="text-gray-400 shrink-0 mx-2" size={20} />
                        <input 
                            type="email" 
                            placeholder="email@kamu.com" 
                            className="flex-1 bg-transparent cursor-text outline-none placeholder:text-gray-400 "
                        />
                    </div>
                </div>
                <div>
                    <button
                        className="bg-ungu flex justify-center w-full font-black text-base px-2 py-4 rounded-2xl"
                    >
                        kirim kode OTP
                    </button>
                </div>
            </form>

            <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-gray-500 text-xs font-bold tracking-widest">ATAU</span>
                <div className="flex-1 h-px bg-gray-700" />
            </div>

            <div>
                <button
                    className="bg-ungu flex justify-center w-full font-black text-base px-2 py-4 rounded-2xl"
                >
                    Lanjut dengan Google
                </button>
            </div>

            <div className="flex items-center justify-center bg-dark mt-6 p-4">
                <div >
                    <div className="flex">
                        <p className="mr-1">
                            Belum punya akun?
                        </p>
                        <a 
                            href="/register" 
                            className="text-ungu font-black"
                        >
                            Daftar dulu di sini
                        </a>
                    </div>
                    <p>
                        Dengan masuk, kamu setuju dengan 
                        <a href="" className="mx-1">kebijakan privasi</a> 
                        dan 
                        <span className="mx-1">ketentuan penggunaan</span>
                        kita.
                    </p>
                </div>
            </div>

        </div>
    )
}