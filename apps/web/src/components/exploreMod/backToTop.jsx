import { ArrowUp } from "lucide-react";

export default function BackToTop({ visible }) {
    if (!visible) return null;

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-30 z-40 mx-auto flex w-full max-w-107.5 justify-end px-5">
            <button
                type="button"
                aria-label="Kembali ke atas"
                onClick={() => {
                    window.scrollTo({
                        top: 0,
                        behavior: "instant",
                    });
                }}
                className="group pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-unguterang text-white active:bg-unguterang/80 shadow-[0_0_8px] shadow-unguterang cursor-pointer"
            >
                <ArrowUp size={20} strokeWidth={2.5} aria-hidden="true" className="group-active:text-white/50 shrink-0" />
            </button>
        </div>
    );
}