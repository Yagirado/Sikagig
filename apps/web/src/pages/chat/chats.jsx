import { Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import BottomNavbar from "../../components/bottomnavbar";

function getConversationLabel(conversation) {
    return conversation.proposal_id ? "Chat Gig" : "Chat Jasa";
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
            getConversationLabel(conversation)
                .toLowerCase()
                .includes(query)
        );
    }, [conversations, search]);

    return (
        <div className="mobile-container min-h-screen py-5! pb-24 text-white">
            <header className="sticky top-0 z-50 mb-4 ml-3 text-start font-black">
                <h1 className="text-2xl font-bold">Chats</h1>
                <label className="mt-2 flex w-full rounded-full bg-dark px-2 py-2">
                    <Search aria-hidden="true" />
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Cari chat"
                        aria-label="Cari chat"
                        className="min-w-0 flex-1 bg-transparent px-2 outline-none placeholder:text-gray-400"
                    />
                </label>
            </header>

            <main className="flex flex-col gap-4">
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
                        className="flex h-20 w-full items-center rounded-3xl border border-gray-700 bg-dark text-left"
                    >
                        <div className="ml-6 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-unguterang">
                            <UserRound size={22} strokeWidth={3} aria-hidden="true" />
                        </div>

                        <div className="ml-4 min-w-0 flex-1">
                            <span className="block truncate text-lg">
                                {getConversationLabel(conversation)}
                            </span>
                            <span className="block truncate text-xs text-gray-400">
                                {conversation.proposal_id
                                    ? "Proposal telah diterima"
                                    : "Pesanan sedang dikerjakan"}
                            </span>
                        </div>
                    </button>
                ))}
            </main>

            <BottomNavbar />
        </div>
    );
}
