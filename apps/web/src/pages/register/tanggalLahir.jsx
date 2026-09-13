import { useId, useState } from "react";
import { parse, isValid, format } from "date-fns";
import { DayPicker } from "@daypicker/react";
import "@daypicker/react/style.css";

export default function TanggalLahir(){
    const id = useId();
    const [teks, setTeks] = useState("");
    const [tanggal, setTanggal] = useState(undefined);
    const [bulan, setBulan] = useState(new Date());
    const [showCalender, setShowCalender] = useState(false);

    function handleInput(e){
        const angka = e.target.value.replace(/\D/g, "").slice(0, 8);
                            
        const hasil = [
            angka.slice(0 ,2),
            angka.slice(2 ,4),
            angka.slice(4 ,8),
        ]
        .filter(Boolean)
        .join("/");

        setTeks(hasil);

        const parsed = parse(hasil, "dd/MM/yyyy", new Date());
        const valid = 
            hasil.length === 10 &&
            isValid(parsed) &&
            format(parsed, "dd/MM/yyyy") === hasil;

        if(valid){
            setTanggal(parsed);
            setBulan(parsed)
        }else {
            setTanggal(undefined)
        }

        e.target.setCustomValidity(
            hasil && !valid ? "DD/MM/YYYY" : ""
        );
    }

    return(
        <div className="flex flex-col gap-1">
            <label className="group flex flex-col gap-1 mt-8 sm:mt-1 cursor-text">
            <p className="font-black group-focus-within:text-unguterang">
                Tanggal Lahir
            </p>

            <input
                id={id}
                type="text"
                inputMode="numeric"
                name="tanggal_lahir"
                placeholder="DD/MM/YYYY"
                maxLength={10}
                required
                value={teks}
                onChange={handleInput}
                onFocus={() => setShowCalender(true)}
                onClick={() => setShowCalender(true)}
                className="
                    w-full min-w-0 bg-dark text-white
                    border-[1.5px] border-gray-600 px-4 py-3 rounded-2xl
                    outline-none focus:border-ungu scheme-dark
                    "
            />
            </label>

            {showCalender && (
                <div 
                    className="
                        overflow-x-auto rounded-2xl border border-gray-600 bg-gray-800 
                        p-3 text-gray-300
                        [&_select]:scheme-dark
                        [&_option]:bg-gray-800
                        [&_option]:text-gray-200"
                    >
                    <DayPicker
                        mode="single"
                        required
                        captionLayout="dropdown"
                        navLayout="after"
                        startMonth={new Date(1970, 0)}
                        endMonth={new Date()}
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
                    className="mt-2 w-full text-sm text-gray-400 cursor-pointer active:text-gray-200"
                    >
                    Tutup kalender
                    </button>
            </div>
            )}
        </div>
);
}