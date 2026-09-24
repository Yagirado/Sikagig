import { ArrowLeft, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function Notifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function getNotifications() {
            try {
                const response = await fetch("api/notifications", {
                    credentials: "include",
                    headers: { Accept: "applications/json" },
                });
                if (!response.ok) {
                    throw new Error("Gagal mengambil notifikasi");
                }
                const data = await response.json();
                setNotifications(data.notifications ?? []);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
        getNotifications();
    })

return (
    <div className="mobile-container text-white pt-1!">

        <div className="flex flex-col gap-4 py-5">
            <div className="relative flex items-center justify-center py-2">
                <h1 className="text-2xl font-black text-white text-center">
                    Notifikasi
                </h1>
                <button onClick={() => navigate("/dashboard")} className="absolute left-0 p-2.5 rounded-2xl bg-neutral-900 border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors">
                    <ArrowLeft size={18} />
                </button>
            </div>

            {loading && (
                <p className="text-center text-gray-400">
                    Memuat notifikasi...
                </p>
            )}

            {error && (
                <p className="text-center text-red-400">
                    {error}
                </p>
            )}

            {!loading && !error && notifications.length === 0 && (
                <p className="text-center text-gray-400">
                    Belum ada notifikasi.
                </p>
            )}

            {notifications.map((notification) => (
                <article
                    key={notification.id}
                    className={`flex items-start gap-3 rounded-2xl border p-4 ${
                        notification.read_at
                            ? "border-gray-800 bg-dark"
                            : "border-ungu/60 bg-ungu/15"
                    }`}>
                    <div className="rounded-full bg-ungu p-2 text-white">
                        <Bell size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="font-bold">
                            {notification.data.message.replace(
                                `: ${notification.data.title}`,
                                ""
                            )}
                        </p>

                        <p className="text-sm mt-0.5 text-gray-200">
                            {notification.data.title}
                        </p>

                        <p className="mt-1.5 text-[11px] text-gray-500">
                            {new Date(notification.created_at).toLocaleString("id-ID", {
                                dateStyle: "medium",
                                timeStyle: "short",
                            })}
                        </p>
                    </div>

                    {!notification.read_at && (
                        <span className="h-2.5 w-2.5 shrink-0 self-center rounded-full bg-ungu" />
                    )}
                </article>
            ))}
        </div>
    </div>
    );
}