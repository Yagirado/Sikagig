import { useEffect } from "react";
import { CircleX } from 'lucide-react';

export default function ErrorPopUp({ message, onClose}){
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    return(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div 
                className="
                    w-[85%] max-w-88.75 max-h-[85dvh] overflow-y-auto rounded-2xl 
                    bg-[#151515] py-6 px-5 text-white border border-gray-700"
            >
                <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-unguterang/20 text-unguterang">
                        <CircleX size={28} />
                    </div>

                    <div className="flex flex-col items-center justify-center gap-1.5">
                        <p className="text-white font-black">
                            Oops
                        </p>
                        <p 
                            role="alert" 
                            className="whitespace-pre-line wrap-break-words text-sm text-center"
                        >
                            {message}
                        </p>
                    </div>
                    
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-4 w-full rounded-2xl py-3 cursor-pointer bg-unguterang text-white font-black"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    )
}
