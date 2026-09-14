export default function ErrorPopUp({ message, onClose}){
    return(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-[85%] max-w-88.75 max-h-[85dvh] overflow-y-auto rounded-2xl bg-[#151515] py-5 px-5 text-white border border-gray-700">
                <p role="alert" className="whitespace-pre-line wrap-break-words">{message}</p>
                <button
                type="button"
                onClick={onClose}
                className="mt-4 cursor-pointer text-unguterang"
                >
                    Tutup
                </button>
            </div>
        </div>
    )
}
