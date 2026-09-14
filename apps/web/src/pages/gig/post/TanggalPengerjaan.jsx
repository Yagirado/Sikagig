import { useId, useState } from "react";
import { parse, isValid, format } from "date-fns";
import { DayPicker } from "@daypicker/react";
import "@daypicker/react/style.css";

export default function TanggalPengerjaan() {
    const id = useId();
    const [teks, setTeks] = useState("");
    const [tanggal, setTanggal] = useState(undefined);
    const [bulan, setBulan] = useState(new Date());
    const [showCalender, setShowCalender] = useState(false);

    function handleInput(e) {
        const angka = e.target.value.replace(/\D/g, "").slice(0, 8);
        const hasil = [
            angka.slice(0, 2),
            angka.slice(2, 4),
            angka.slice(4, 8),
        ]
        .filter(Boolean)
        .join("/");

        setTeks(hasil);

        const parsed = parse(hasil, "dd/MM/yyyy", new Date());
        const valid = 
            hasil.length === 10 &&
            isValid(parsed) &&
            format(parsed, "dd/MM/yyyy") === hasil;

        if (valid) {
            setTanggal(parsed);
            setBulan(parsed);
        } else {
            setTanggal(undefined);
        }

        e.target.setCustomValidity(
            hasil && !valid ? "DD/MM/YYYY" : ""
        );
    }

    return (
        <div className="flex flex-col gap-2 relative">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider cursor-pointer" htmlFor={id}>
                Tanggal Pengerjaan
            </label>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 focus-within:border-ungu transition-colors">
                <input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    name="tanggal_pengerjaan"
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                    value={teks}
                    onChange={handleInput}
                    onFocus={() => setShowCalender(true)}
                    onClick={() => setShowCalender(true)}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-500"
                />
            </div>

            {showCalender && (
                <div 
                    className="
                        absolute top-[85px] left-0 z-20 w-full overflow-x-auto rounded-2xl border border-gray-600 bg-[#1a1a1a] 
                        p-3 text-gray-300 shadow-xl
                        [&_select]:scheme-dark
                        [&_option]:bg-gray-800
                        [&_option]:text-gray-200"
                >
                    <DayPicker
                        mode="single"
                        captionLayout="dropdown"
                        navLayout="after"
                        startMonth={new Date()}
                        endMonth={new Date(new Date().getFullYear() + 2, 11)}
                        selected={tanggal}
                        month={bulan}
                        onMonthChange={setBulan}
                        onSelect={(pilihan) => {
                            if (!pilihan) return;
                            setTanggal(pilihan);
                            setBulan(pilihan);
                            setTeks(format(pilihan, "dd/MM/yyyy"));

                            const input = document.getElementById(id);
                            if (input instanceof HTMLInputElement) {
                                input.setCustomValidity("");
                            }
                            setShowCalender(false);
                        }}
                    />

                    <button
                        type="button"
                        onClick={() => setShowCalender(false)}
                        className="mt-2 w-full font-bold text-sm text-unguterang cursor-pointer active:text-ungu transition-colors"
                    >
                        Tutup Kalender
                    </button>
                </div>
            )}
        </div>
    );
}
