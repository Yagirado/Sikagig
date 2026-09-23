import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import NamaLengkap from "../../components/loginMod/namaLengkap";
import Gender from "../../components/loginMod/gender";
import Email from "../../components/email";
import Nim from "../../components/loginMod/nim";

export default function EditProfile() {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState("");
    const [NIM, setNim] = useState("");
    const [email, setEmail] = useState("");
    const [gender, setGender] = useState("");

    useEffect(() => {
        async function getUser() {
            const response = await fetch("/api/auth/me", {
                credentials: "include",
                headers: { Accept: "application/json" },
            });

            if (response.ok) {
                const data = await response.json();
                setFullName(data.user?.fullName ?? "");
                setNim(data.user?.NIM ?? "");
                setEmail(data.user?.email ?? "");
                setGender(data.user?.gender ?? "");
            }
        }
        getUser();
    }, []);

return (
    <div className="mobile-container text-white pt-1!">

        <header className="sticky top-0 z-50 -mx-6 bg-[#151515] px-6 py-2.5">
            <div className="relative flex items-center justify-center py-2">
                <h1 className="text-lg font-black text-white text-center">
                    Edit Profile
                </h1>
                <button onClick={() => navigate("/profile")} className="absolute left-0 p-2.5 rounded-2xl bg-neutral-900 border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors">
                    <ArrowLeft size={18} />
                </button>
            </div>
        </header>
        
        <div>
            {/*Buat ganti profile*/}
        </div>
        <div className="mt-5">
            <NamaLengkap fullName={fullName} setFullName={setFullName} />
        </div>
        <div className="mt-5">
            <Nim nim={NIM} setNim={setNim} />
        </div>
        <div className="mt-3 transition-colors focus-within:text-unguterang">
            <label htmlFor="bio" className="text-sm font-black uppercase">
                BIO
            </label>
            <div className="relative mt-2">
                <textarea
                    id="bio"
                    name="bio"
                    placeholder="Ceritakan tentang diri kamu..."
                    className="h-32 resize-none w-full rounded-2xl border border-gray-600 bg-dark px-4 py-4 text-sm text-white font-bold outline-none placeholder:text-gray-400 focus:border-unguterang"
                />
            </div>
        </div>
        <Gender gender={gender} setGender={setGender} />
        <div className="mt-5">
            <Email email={email} setEmail={setEmail} />
        </div>
        <button
            type="button"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-ungu px-4 py-4 text-sm font-black text-white transition-colors hover:bg-unguterang focus:outline-none focus:ring-2 focus:ring-unguterang focus:ring-offset-2 focus:ring-offset-[#151515]">
            <Save size={18} />
            Simpan Perubahan
        </button>
    </div>
    );
}
