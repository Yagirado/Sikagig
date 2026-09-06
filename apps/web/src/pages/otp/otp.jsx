import { ArrowLeft, Mail, Clipboard, CircleCheckBig } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router";

export default function Otp(){
    const [otp, setOtp] = useState(["", "", "", ""]);
    const inputRefs = useRef([]);

    function handleChange(value, index){
        if(!/^\d?$/.test(value)) return;

        setOtp((prev) =>
            prev.map((digit, i) => (i === index ? value : digit))
        );

        if(value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    }

    function handleKeyDown(event, index) {
        if (event.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }

    async function handlePaste() {
        try {
            const text = await navigator.clipboard.readText();
            const code = text.trim();

            if (!/^\d{4}$/.test(code)) {
                return;
            }

            setOtp(code.split(""));
            inputRefs.current[3]?.focus();
        } catch {
            alert("Clipboard tidak bisa dibaca. Izinkan akses atau isi OTP manual");
        }
    }

    return(
        <div className="mobile-container py-0!">
            <div className="relative flex justify-center items-center px-6 pt-10 pb-3">
                <Link
                        to="/login"
                        className="
                            group absolute left-0 top-10 flex h-11 w-11 items-center justify-center rounded-full
                            border border-gray-800 bg-dark
                            active:border-gray-800/40 active:bg-dark/40"
                        draggable={false}
                    >
                        <ArrowLeft size={24} className="shrink-0 text-white group-active:text-white/40" />
                </Link>
                <div className="mx-auto mt-40 mb-2 sm:mt-3 w-fit rounded-full border border-ungu/30 bg-ungu/20 p-6">
                    <Mail  
                        size={32}
                        className="text-unguterang"
                    />
                </div>
            </div>

            <div className="flex flex-col justify-center items-center text-white gap-2 pb-1">
                <h2 className="text-[28px] font-black">
                    Cek email kamu
                </h2>
                <p className="text-[14px] tracking-wide">
                    Udah kita kirim ke
                    <span className="ml-1 text-unguterang font-black">nugrahaadani@gmail.com</span> 
                </p>
            </div>

            <div className="my-6 flex justify-center gap-4">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={(element) => {
                            inputRefs.current[index] = element;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        aria-label={`Angka OTP ke-${index + 1}`}
                        onChange={(event) => handleChange(event.target.value, index)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        onFocus={(event) => event.currentTarget.select()}
                        onClick={(event) => event.currentTarget.select()}
                        className={`
                            h-14 w-12 rounded-2xl border border-gray-800
                            text-center text-3xl font-black text-white outline-none
                            ${digit
                                ? "bg-ungu/20 border-unguterang"
                                : "bg-[#171717] border-gray-800/80"
                            }`}
                    />
                ))}   
            </div>

            <div className="-mt-2">
                <button
                    type="button"
                    onClick={handlePaste}
                    className="
                        mx-auto flex items-center justify-center rounded-full font-semibold
                        bg-ungu/10 border border-unguterang/40 px-3 py-2 
                        text-unguterang tracking-tight text-sm cursor-pointer
                        active:text-unguterang/30 active:bg-dark/30 active:border-unguterang/30"
                >
                    <Clipboard className="mr-2 shrink-0 font-black" size={16} strokeWidth={2.5} />
                    Paste
                </button>
            </div>

            <div 
                className="
                    flex items-center justify-center mx-auto mt-6 py-4 w-full bg-ungu rounded-2xl
                    text-white font-black tracking-wide cursor-pointer 
                    active:bg-ungu/40 active:text-white/40"
            >
                <button
                    type="submit"
                    className="flex items-center justify-center"
                >
                    <CircleCheckBig className="mr-2 shrink-0" size={22} strokeWidth={3} />
                    verifikasi Lanjut
                </button>
            </div>

            <div>
                <button
                    type="button"
                    className="flex justify-center items-center mx-auto mt-8 text-white font-bold text-sm cursor-pointer"
                >
                    kirim ulang <span className="ml-1 text-unguterang font-black">Kode OTP</span>
                </button>
            </div>
        </div>
    )
}
