import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, X } from "lucide-react";
import Picker from "react-mobile-picker";
import { clampDeadlineDate, dateToSelection, selectionToDate } from "../../../lib/deadlineDate";

const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function TanggalGig({ value, onChange }) {
    const id = useId();
    const inputRef = useRef(null);
    const dialogRef = useRef(null);
    const [localDate, setLocalDate] = useState("");
    const deadline = value !== undefined ? value : localDate;
    const setDeadline = onChange || setLocalDate;

    const today = new Date();
    const currentYear = today.getFullYear();
    const [pilihan, setPilihan] = useState({
        day: String(today.getDate()),
        month: String(today.getMonth() + 1),
        year: String(currentYear),
    });
    const [showPicker, setShowPicker] = useState(false);

    const year = Number(pilihan.year);
    const month = Number(pilihan.month);
    const lastDay = new Date(year, month, 0).getDate();

    const columns = [
        { name: "day", label: "Hari", values: Array.from({ length: lastDay }, (_, i) => String(i + 1)) },
        { name: "month", label: "Bulan", values: Array.from({ length: 12 }, (_, i) => String(i + 1)) },
        { name: "year", label: "Tahun", values: Array.from({ length: 6 }, (_, i) => String(currentYear + i)) },
    ];

    useEffect(() => {
        if (!showPicker) return;
        const dialog = dialogRef.current;
        const previousOverflow = document.body.style.overflow;
        dialog.showModal();
        document.body.style.overflow = "hidden";

        return () => {
            dialog.close();
            document.body.style.overflow = previousOverflow;
        };
    }, [showPicker]);

    function openPicker() {
        const saved = dateToSelection(deadline) || {
            day: String(today.getDate()),
            month: String(today.getMonth() + 1),
            year: String(currentYear),
        };
        setPilihan(clampDeadlineDate(saved));
        setShowPicker(true);
    }

    function saveDate() {
        const val = selectionToDate(clampDeadlineDate(pilihan));
        setDeadline(val);
        setShowPicker(false);
    }

    function clearDate(e) {
        e.stopPropagation();
        setDeadline("");
    }

    function formatDisplayDate(dateStr) {
        if (!dateStr) return "";
        try {
            const [y, m, d] = dateStr.split("-").map(Number);
            return `${d} ${MONTHS[m - 1]} ${y}`;
        } catch {
            return dateStr;
        }
    }

    function moveColumn(event, column) {
        const index = column.values.indexOf(pilihan[column.name]);
        const nextIndex = {
            ArrowUp: index - 1,
            ArrowDown: index + 1,
            Home: 0,
            End: column.values.length - 1,
        }[event.key];

        if (nextIndex === undefined) return;
        event.preventDefault();
        const next = column.values[Math.max(0, Math.min(nextIndex, column.values.length - 1))];
        setPilihan(clampDeadlineDate({ ...pilihan, [column.name]: next }));
    }

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Tanggal Pengerjaan / Target Selesai
            </label>

            <div className="relative">
                <CalendarDays
                    aria-hidden="true"
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                
                
                <input
                    ref={inputRef}
                    id={id}
                    type="text"
                    readOnly
                    placeholder="Pilih tanggal target pengerjaan"
                    value={formatDisplayDate(deadline)}
                    onClick={openPicker}
                    onKeyDown={(event) => {
                        if (["Enter", " ", "ArrowDown"].includes(event.key)) {
                            event.preventDefault();
                            openPicker();
                        }
                    }}
                    className="w-full min-w-0 cursor-pointer rounded-2xl border border-gray-800 bg-[#1a1a1a] py-4 pl-12 pr-10 text-sm font-medium text-white outline-none placeholder:text-gray-500 active:border-gray-700 focus:border-ungu transition-colors"
                />

                <input type="hidden" name="deadline" value={deadline} />

                {deadline && (
                    <button
                        type="button"
                        onClick={clearDate}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 active:text-white p-1"
                        title="Hapus tanggal"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
            
            <span className="text-[10px] text-gray-500">*Opsional, tentukan tanggal jika punya deadline tertentu</span>

            {createPortal(
                <dialog
                    ref={dialogRef}
                    id={id + "-picker"}
                    aria-labelledby={id + "-title"}
                    onCancel={() => setShowPicker(false)}
                    onClick={(event) => {
                        if (event.target === event.currentTarget) setShowPicker(false);
                    }}
                    className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[90dvh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl border-0 bg-[#292929] p-0 text-white shadow-2xl backdrop:bg-black/60 z-50"
                >
                    <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
                        <div aria-hidden="true" className="mx-auto mb-6 h-1 w-10 rounded-full bg-white/20" />
                        
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => setShowPicker(false)}
                                className="cursor-pointer rounded-lg px-2 py-2 text-sm text-white/60 active:text-white transition-colors"
                            >
                                Batal
                            </button>
                            <h2 id={id + "-title"} className="text-base font-bold">
                                Tanggal Pengerjaan
                            </h2>
                            <button
                                type="button"
                                onClick={saveDate}
                                className="cursor-pointer rounded-lg px-2 py-2 text-sm font-bold text-unguterang active:opacity-80 transition-opacity"
                            >
                                Simpan
                            </button>
                        </div>

                        <div aria-hidden="true" className="grid grid-cols-3 text-center text-xs font-semibold uppercase tracking-wider text-white/40">
                            <span>Hari</span>
                            <span>Bulan</span>
                            <span>Tahun</span>
                        </div>

                        {showPicker && (
                            <div className="relative mt-2">
                                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 h-12 -translate-y-1/2 rounded-xl bg-white/[0.07]" />
                                <Picker
                                    value={pilihan}
                                    onChange={(val) => setPilihan(clampDeadlineDate(val))}
                                    wheelMode="normal"
                                    height={240}
                                    itemHeight={48}
                                >
                                    {columns.map((column) => (
                                        <Picker.Column
                                            key={column.name}
                                            name={column.name}
                                            role="spinbutton"
                                            tabIndex={0}
                                            aria-label={column.label}
                                            aria-valuemin={Number(column.values[0])}
                                            aria-valuemax={Number(column.values.at(-1))}
                                            aria-valuenow={Number(pilihan[column.name])}
                                            aria-valuetext={column.name === "month" ? MONTHS[month - 1] : pilihan[column.name]}
                                            onKeyDown={(event) => moveColumn(event, column)}
                                            className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-unguterang"
                                        >
                                            {column.values.map((val) => (
                                                <Picker.Item key={val} value={val}>
                                                    {({ selected }) => (
                                                        <span
                                                            aria-hidden="true"
                                                            className={
                                                                "text-xl transition-colors " +
                                                                (selected ? "font-semibold text-white" : "text-white/30")
                                                            }
                                                        >
                                                            {column.name === "month" ? MONTHS[Number(val) - 1] : val}
                                                        </span>
                                                    )}
                                                </Picker.Item>
                                            ))}
                                        </Picker.Column>
                                    ))}
                                </Picker>
                            </div>
                        )}
                        <p className="mt-2 text-center text-xs text-white/40">Geser untuk memilih target tanggal pengerjaan</p>
                    </div>
                </dialog>,
                document.body
            )}
        </div>
    );
}
