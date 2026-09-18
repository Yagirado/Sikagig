import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { Mail } from "lucide-react";

export default function RegistAccount({ showRegister, setShowRegister }){
    const navigate = useNavigate();
    const googlePopupRef = useRef(null);

    useEffect(() => {
        function handleGoogleMessage(event){
            if(event.origin !== window.location.origin) return;

            const popup = googlePopupRef.current;
            
            if (!popup || event.source !== popup) return;
            if (event.data?.type !== "google-register-ready") return;

            googlePopupRef.current = null;
            popup.close();

            setShowRegister(false);
            window.focus();
            
            const destination = event.data.needsEmailVerification ? "/google?step=verify-email" : "/google";

            navigate(destination, {replace: true});
        }

        window.addEventListener("message", handleGoogleMessage);

        return () => {
            window.removeEventListener("message", handleGoogleMessage);
        }
    }, [navigate, setShowRegister])

    function handleGoogleRegister() {
        const width = 500;
        const height = 650;

        const left = Math.round(
            window.screenX + (window.outerWidth - width) / 2
        );
        const top = Math.round(
            window.screenY + (window.outerHeight - height) / 2
        );

        const popup = window.open(
            "/api/auth/google/register/redirect",
            "google-register",
            `popup=yes,width=${width},height=${height},left=${left},top=${top}`
        );

        if (!popup) {
            window.alert("Izinkan popup di browser untuk daftar dengan Google.");
            return;
        }

        googlePopupRef.current = popup;
        popup.focus();
    }

    

    return(
    <div>
        <p 
            onClick={() => setShowRegister(!showRegister)}
            className="text-unguterang font-black cursor-pointer active:text-unguterang/60"
        >
            Daftar dulu di sini
        </p>

        {showRegister && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="w-[85%] max-w-88.75 rounded-2xl bg-[#151515] py-5 px-5 text-white  border border-gray-700">
                    <h2 className="mb-4 text-2xl font-black">
                        Daftar akun
                    </h2>

                    <p className="flex items-center justify-center mb-4 text-sm">
                        Pilih metode daftar yang kamu mau. Email lanjut ke form lengkap, atau daftar cepat pakai Google.
                    </p>

                    <div className="flex items-center justify-center rounded-2xl bg-ungu active:bg-ungu/40 active:text-white/40">
                        <Link
                            to="/register"
                            className="flex items-center justify-center w-full font-black text-base gap-2 px-2 py-4 cursor-pointer"
                            draggable={false}
                        >
                            <Mail className="text-current shrink-0" size={20}  />
                            Daftar pakai Email  
                        </Link>
                    </div>

                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-gray-700" />
                        <span className="text-gray-400 text-xs font-black tracking-widest">ATAU</span>
                        <div className="flex-1 h-px bg-gray-700" />
                    </div>

                    <div className="flex flex-col justify-center items-center">
                        <button
                            type="button"
                            onClick={handleGoogleRegister}
                            className="
                                flex w-full items-center justify-center rounded-2xl bg-dark text-base font-black
                                border border-gray-700 px-2 py-4 cursor-pointer active:text-white/70"
                        >
                            <FontAwesomeIcon icon={faGoogle} className="mr-2 shrink-0 text-[#EA4335]" />
                            Daftar dengan Google
                        </button>

                        <p 
                            onClick={() => setShowRegister(!showRegister)}
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