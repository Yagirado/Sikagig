import { Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import BottomNavbar from "../../components/bottomnavbar";

function getConversationLabel(conversation) {
    return conversation.other_user?.fullName || (conversation.proposal_id ? "Chat Gig" : "Chat Jasa");
}

export default function Chats() {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function loadConversations() {
            try {
                const response = await fetch("/api/conversations", {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                    signal: controller.signal,
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Gagal memuat daftar chat."
                    );
                }

                if (!controller.signal.aborted) {
                    setConversations(data.data || []);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setError(error.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void loadConversations();

        return () => controller.abort();
    }, []);

    const filteredConversations = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return conversations;

        return conversations.filter((conversation) =>
            conversation.other_user?.fullName
                ?.toLocaleLowerCase("id-ID")
                .includes(query)
        );
    }, [conversations, search]);

    return (
        <div className="mobile-container min-h-screen pt-0! pb-24! text-white">
            <header className="sticky top-0 z-50 -mx-6 mb-4 bg-[#151515] px-6 pb-3 pt-3">
                <div className="ml-3 text-start">
                    <h1 className="text-2xl font-black">Chats</h1>
                    <label className="mt-3 flex h-12 w-full items-center gap-2 rounded-2xl border border-white/10 bg-dark px-4 transition-colors focus-within:border-unguterang">
                        <Search size={19} aria-hidden="true" className="shrink-0 text-gray-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari nama orang"
                            aria-label="Cari nama orang"
                            className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
                        />
                    </label>
                </div>
            </header>

            <main className="ml-3 flex flex-col gap-4">
                {loading && (
                    <p className="py-8 text-center text-sm text-gray-400">
                        Memuat daftar chat...
                    </p>
                )}

                {error && (
                    <p role="alert" className="py-8 text-center text-sm text-red-400">
                        {error}
                    </p>
                )}

                {!loading && !error && filteredConversations.length === 0 && (
                    <p className="py-8 text-center text-sm text-gray-400">
                        {search
                            ? "Chat tidak ditemukan."
                            : "Belum ada chat yang tersedia."}
                    </p>
                )}

                {filteredConversations.map((conversation) => (
                    <button
                        key={conversation.id}
                        type="button"
                        onClick={() =>
                            navigate(`/chats/room/${conversation.id}`)
                        }
                        className="flex min-h-18 w-full items-center rounded-3xl border border-gray-700 bg-dark py-3 text-left"
                    >
                        <div className="ml-6 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-unguterang">
                            <UserRound size={22} strokeWidth={3} aria-hidden="true" />
                        </div>

                        <div className="ml-4 min-w-0 flex-1">
                            <span className="block truncate text-lg">
                                {getConversationLabel(conversation)}
                            </span>
                            <span className="block max-w-[220px] truncate text-xs text-gray-500">
                                {conversation.last_message?.message || (conversation.last_message?.attachments?.length ? "📎 Lampiran" : "Belum ada pesan")}
                            </span>
                        </div>
                    </button>
                ))}
            </main>

            <BottomNavbar />
        </div>
    );
}
