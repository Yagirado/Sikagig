import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

export default function UrutanPopup({ open, onClose, urutan, activeUrutan, onSelect }) {
    const dialogRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        const dialog = dialogRef.current;
        const previousOverflow = document.body.style.overflow;
        dialog.showModal();
        document.body.style.overflow = "hidden";

        return () => {
            dialog.close();
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    return createPortal(
        <dialog
            ref={dialogRef}
            id="explore-urutan"
            aria-labelledby="explore-urutan-title"
            onCancel={onClose}
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
            className="bottom-sheet fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[85dvh] w-full max-w-107.5 overflow-y-auto rounded-t-3xl border-0 bg-[#292929] p-0 text-white shadow-2xl backdrop:bg-black/60 hide-scrollbar"
        >
            <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
                <div aria-hidden="true" className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 id="explore-urutan-title" className="text-lg font-bold">Urutkan berdasarkan</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-lg px-2 py-2 text-sm text-white/60 focus-visible:outline-2 focus-visible:outline-unguterang active:text-white/80"
                    >
                        Tutup
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    {urutan.map((item, index) => {
                        return (
                            <button
                                key={item}
                                type="button"
                                aria-pressed={activeUrutan === index}
                                onClick={() => {
                                    onSelect(index);
                                    onClose();
                                }}
                                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-unguterang ${activeUrutan === index ? "border-gray-800 bg-unguterang text-white active:bg-unguterang/80" : "border-white/10 text-white/80 active:bg-white/5"}`}
                            >
                                <span className="flex-1">{item}</span>
                                {activeUrutan === index && <Check aria-hidden="true" size={18} />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </dialog>,
        document.body,
    );
}
