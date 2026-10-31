import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays } from "lucide-react";
import Picker from "react-mobile-picker";
import { FIRST_BIRTH_YEAR, birthDateError, clampBirthDate, dateToSelection, selectionToDate } from "../../lib/birthDate";

const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function TanggalLahir({ tanggalLahir: value, setTanggalLahir: onChange, setErrorMessage }) {
    const id = useId();
    const inputRef = useRef(null);
    const dialogRef = useRef(null);
    const [localDate, setLocalDate] = useState("");
    const tanggalLahir = value ?? localDate;
    const setTanggalLahir = onChange ?? setLocalDate;
    const [pilihan, setPilihan] = useState({ day: "1", month: "1", year: "2000" });
    const [showPicker, setShowPicker] = useState(false);
    const [error, setError] = useState("");
    const today = new Date();
    const year = Number(pilihan.year);
    const month = Number(pilihan.month);
    const lastMonth = year === today.getFullYear() ? today.getMonth() + 1 : 12;
    const lastDay = year === today.getFullYear() && month === today.getMonth() + 1
        ? today.getDate()
        : new Date(year, month, 0).getDate();
    const columns = [
        { name: "day", label: "Hari", values: Array.from({ length: lastDay }, (_, i) => String(i + 1)) },
        { name: "month", label: "Bulan", values: Array.from({ length: lastMonth }, (_, i) => String(i + 1)) },
        { name: "year", label: "Tahun", values: Array.from({ length: today.getFullYear() - FIRST_BIRTH_YEAR + 1 }, (_, i) => String(FIRST_BIRTH_YEAR + i)) },
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
        const saved = birthDateError(tanggalLahir) === ""
        ? dateToSelection(tanggalLahir)
        : { day: "1", month: "1", year: "2000" };
        setPilihan(clampBirthDate(saved));
        setShowPicker(true);
    }

    function saveDate() {
        const value = selectionToDate(clampBirthDate(pilihan));
        setTanggalLahir(value);
        inputRef.current.setCustomValidity("");
        setError("");
        setShowPicker(false);
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
        setPilihan(clampBirthDate({ ...pilihan, [column.name]: next }));
    }

    return (
        <div className="group mt-8 flex flex-col gap-2 sm:mt-1">
            <label htmlFor={id} className="font-black group-focus-within:text-unguterang">
                Tanggal Lahir
            </label>
        <div className="relative">
            <CalendarDays aria-hidden="true" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
            <input
                ref={inputRef}
                id={id}
                type="text"
                name="tanggal_lahir"
                required
                inputMode="none"
                placeholder="Pilih tanggal lahir"
                value={tanggalLahir}
                aria-haspopup="dialog"
                aria-expanded={showPicker}
                aria-controls={id + "-picker"}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? id + "-error" : undefined}
                onClick={openPicker}
                onKeyDown={(event) => {
                    if (["Enter", " ", "ArrowDown"].includes(event.key)) {
                    event.preventDefault();
                    openPicker();
                    }
                }}
                onChange={(event) => {
                    const value = event.target.value;
                    const message = birthDateError(value);
                    setTanggalLahir(value);
                    setError(message);
                    event.target.setCustomValidity(message);
                }}
                onInvalid={(event) => {
                    event.preventDefault();
                    const message = birthDateError(tanggalLahir);
                    setError(message);
                    if (setErrorMessage) {
                        setErrorMessage(message);
                    } else {
                        inputRef.current.focus();
                        openPicker();
                    }
                }}
                className="w-full min-w-0 cursor-pointer rounded-2xl border border-gray-600 bg-dark py-4 pl-12 pr-4 text-white outline-none placeholder:text-gray-400 focus:border-ungu"
            />
        </div>

        {createPortal(
            <dialog
            ref={dialogRef}
            id={id + "-picker"}
            aria-labelledby={id + "-title"}
            onCancel={() => setShowPicker(false)}
            onClick={(event) => {
                if (event.target === event.currentTarget) setShowPicker(false);
            }}
            className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[90dvh] w-full max-w-107.5 overflow-y-auto rounded-t-3xl border-0 bg-[#292929] p-0 text-white shadow-2xl backdrop:bg-black/60"
            >
            <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
                <div aria-hidden="true" className="mx-auto mb-6 h-1 w-10 rounded-full bg-white/20" />
                <div className="mb-5 flex items-center justify-between gap-3">
                <button type="button" onClick={() => setShowPicker(false)} className="cursor-pointer rounded-lg px-2 py-2 text-sm text-white/60 focus-visible:outline-2 focus-visible:outline-unguterang">
                    Batal
                </button>
                <h2 id={id + "-title"} className="text-base font-bold">Tanggal lahir</h2>
                <button type="button" onClick={saveDate} className="cursor-pointer rounded-lg px-2 py-2 text-sm font-bold text-unguterang focus-visible:outline-2 focus-visible:outline-unguterang">
                    Simpan
                </button>
                </div>
                <div aria-hidden="true" className="grid grid-cols-3 text-center text-xs font-semibold uppercase tracking-wider text-white/40">
                <span>Hari</span><span>Bulan</span><span>Tahun</span>
                </div>
                {showPicker && (
                <div className="relative mt-2">
                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 h-12 -translate-y-1/2 rounded-xl bg-white/[0.07]" />
                    <Picker
                    value={pilihan}
                    onChange={(value) => setPilihan(clampBirthDate(value))}
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
                        {column.values.map((value) => (
                            <Picker.Item key={value} value={value}>
                            {({ selected }) => (
                                <span aria-hidden="true" className={"text-xl transition-colors " + (selected ? "font-semibold text-white" : "text-white/30")}>
                                {column.name === "month" ? MONTHS[Number(value) - 1] : value}
                                </span>
                            )}
                            </Picker.Item>
                        ))}
                        </Picker.Column>
                    ))}
                    </Picker>
                </div>
                )}
                <p className="mt-2 text-center text-xs text-white/40">Geser untuk memilih tanggal lahir</p>
            </div>
            </dialog>,
            document.body,
        )}
        </div>
    );
}
