import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getCsrfToken } from "../../lib/api";
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
    const [loadingUser, setLoadingUser] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [saveSuccess, setSaveSuccess] = useState("");

    useEffect(() => {
        let ignore = false;
        async function getUser() {
            setLoadingUser(true);
            setFetchError("");
            try {
                const response = await fetch("/api/auth/me", {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });
                if (!response.ok) throw new Error("Gagal memuat data profil.");
                const data = await response.json();
                if (!ignore && data.user) {
                    setFullName(data.user?.fullName ?? "");
                    setNim(data.user?.NIM ?? "");
                    setEmail(data.user?.email ?? "");
                    setGender(data.user?.gender ?? "");
                }
            } catch (err) {
                if (!ignore) setFetchError(err.message ?? "Gagal memuat profil.");
            } finally {
                if (!ignore) setLoadingUser(false);
            }
        }
        getUser();
        return () => { ignore = true; };
    }, []);

    async function handleSave() {
        setSaving(true);
        setSaveError("");
        setSaveSuccess("");
        try {
            const csrfToken = await getCsrfToken();
            const response = await fetch("/api/profile", {
                method: "PATCH",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({ fullName, NIM, gender }),
            });
            const data = await response.json();
            if (!response.ok) {
                const firstError = data?.errors
                    ? Object.values(data.errors).flat()[0]
                    : data?.message;
                throw new Error(firstError ?? "Gagal menyimpan perubahan.");
            }
            setSaveSuccess("Profil berhasil diperbarui!");
            setTimeout(() => navigate("/profile"), 1200);
        } catch (err) {
            setSaveError(err.message ?? "Terjadi kesalahan jaringan.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mobile-container text-white pt-1!">
            <header className="sticky top-0 z-50 -mx-6 bg-[#151515] px-6 py-2.5">
                <div className="relative flex items-center justify-center py-2">
                    <h1 className="text-lg font-black text-white text-center">
                        Edit Profile
                    </h1>
                    <button onClick={() => navigate("/profile")} className="absolute left-0 p-2.5 rounded-full bg-neutral-900 border border-gray-700 text-gray-300 active:bg-gray-800">
                        <ArrowLeft size={18} />
                    </button>
                </div>
            </header>

            {loadingUser ? (
                <p className="py-10 text-center text-sm text-gray-400">Memuat profil...</p>
            ) : fetchError ? (
                <div className="mt-6 rounded-2xl bg-red-500/10 p-4 text-sm text-red-400">
                    {fetchError}
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-3 block w-full rounded-xl bg-ungu py-2 text-xs font-bold text-white"
                    >
                        Coba lagi
                    </button>
                </div>
            ) : (
                <>
                    <div className="mt-5">
                        <NamaLengkap fullName={fullName} setFullName={setFullName} />
                    </div>
                    <div className="mt-5">
                        <Nim nim={NIM} setNim={setNim} />
                    </div>
                    <Gender gender={gender} setGender={setGender} />
                    <div className="mt-5">
                        <Email email={email} setEmail={setEmail} />
                    </div>

                    {saveError && (
                        <p role="alert" className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
                            {saveError}
                        </p>
                    )}
                    {saveSuccess && (
                        <p role="status" className="mt-4 rounded-xl bg-green-500/10 p-3 text-sm text-green-400">
                            {saveSuccess}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-ungu px-4 py-4 text-sm font-black text-white transition-colors hover:bg-unguterang disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-unguterang focus:ring-offset-2 focus:ring-offset-[#151515]">
                        <Save size={18} />
                        {saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </>
            )}
        </div>
    );
}