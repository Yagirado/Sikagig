import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function FilterPopup({ open, onClose, categories, selectedCategories, onToggle }) {
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
            id="explore-filter"
            aria-labelledby="explore-filter-title"
            onCancel={onClose}
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
            className="bottom-sheet fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[85dvh] w-full max-w-107.5 overflow-y-auto rounded-t-3xl border-0 bg-[#292929] p-0 text-white shadow-2xl backdrop:bg-black/60 hide-scrollbar"
        >
            <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
                <div aria-hidden="true" className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 id="explore-filter-title" className="text-lg font-bold">
                        Filter kategori
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-lg px-2 py-2 text-sm text-white/60 focus-visible:outline-2 focus-visible:outline-unguterang active:text-white/80"
                    >
                        Tutup
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {categories.map((item) => {
                        const Icon = item.icon;
                        const checked = selectedCategories.includes(item.name);

                        return (
                            <label
                                key={item.name}
                                className={`flex min-w-0 cursor-pointer items-center gap-2
                                    rounded-xl border px-3 py-3 text-sm 
                                    ${
                                        checked
                                            ? "border-unguterang bg-ungu/15 text-unguterang"
                                            : "border-white/10 text-white/80"
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    name="categories"
                                    value={item.name}
                                    checked={checked}
                                    onChange={() => onToggle(item.name)}
                                    className="h-4 w-4 shrink-0 accent-unguterang sr-only"
                                />

                                <Icon 
                                    aria-hidden="true" 
                                    size={18} 
                                    className="shrink-0" 
                                />
                                <span className="min-w-0 wrap-break-words">
                                    {item.name}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>
        </dialog>,
        document.body,
    );
}
