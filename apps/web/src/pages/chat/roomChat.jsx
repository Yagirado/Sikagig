import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Paperclip, Send, UserRound } from "lucide-react";
import { useNavigate } from "react-router";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "long", year: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export default function RoomChat({ initialMessages = [], recipientName = "Nugi" }) {
    const navigate = useNavigate();
    // Local conversation state until the chat API is available.
    const [messages, setMessages] = useState(initialMessages);
    const [draft, setDraft] = useState("");
    const conversationRef = useRef(null);
    const inputRef = useRef(null);

    const messageGroups = new Map();
    [...messages]
        .sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt))
        .forEach((message) => {
            const date = dateFormatter.format(new Date(message.createdAt));
            if (!messageGroups.has(date)) messageGroups.set(date, []);
            messageGroups.get(date).push(message);
        });

    useEffect(() => {
        const conversation = conversationRef.current;
        if (conversation) conversation.scrollTop = conversation.scrollHeight;
    }, [messages]);

    function sendMessage(event) {
        event.preventDefault();
        const text = draft.trim();
        if (!text) return;

        setMessages((previous) => [...previous, {
            id: crypto.randomUUID(),
            text,
            sender: "me",
            createdAt: new Date().toISOString(),
        }]);
        setDraft("");
        inputRef.current?.focus();
    }

    return (
        <div className="mobile-container flex h-dvh min-h-0! flex-col text-white py-0!">
            <header className="sticky top-0 z-50 -mx-6 flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#151515] px-4 py-3">
                <button
                    type="button"
                    onClick={() => navigate("/chats")}
                    aria-label="Kembali ke daftar chat"
                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-white active:text-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-unguterang"
                >
                    <ArrowLeft size={25} aria-hidden="true" />
                </button>

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-unguterang">
                    <UserRound size={18} strokeWidth={3} aria-hidden="true" />
                </div>

                <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {recipientName}
                </h1>
            </header>

            <main
                ref={conversationRef}
                aria-label="Percakapan"
                className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6 py-4"
            >
                {messages.length === 0 ? (
                    <div className="flex min-h-full flex-col items-center justify-center gap-3 py-8 text-center">
                        <div className="mb-1 flex h-20 w-20 items-center justify-center rounded-[28px] bg-unguterang/15 text-unguterang">
                            <MessageCircle size={32} strokeWidth={2.2} aria-hidden="true" />
                        </div>
                        <h2 className="text-lg font-extrabold">Belum ada pesan</h2>
                        <p className="max-w-full text-sm leading-6 text-gray-400 wrap-anywhere">
                            {`Sapa ${recipientName} dan mulai obrolannya`}
                        </p>
                    </div>
                ) : (
                    <div role="log" aria-label="Pesan percakapan" className="space-y-5">
                        {[...messageGroups].map(([date, dailyMessages]) => (
                            <section key={date} aria-label={date} className="space-y-3">
                                <div className="mb-4 flex justify-center">
                                    <span className="rounded-full border border-white/10 bg-unguterang/15 px-4 py-1 text-xs font-semibold text-gray-400">
                                        {date}
                                    </span>
                                </div>
                                {dailyMessages.map((message) => (
                                    <div key={message.id} className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
                                        <article
                                            aria-label={message.sender === "me" ? "Pesan Anda" : `Pesan dari ${recipientName}`}
                                            className={`min-w-0 max-w-[85%] rounded-3xl border border-white/10 bg-dark px-4 py-3 ${message.sender === "me" ? "rounded-br-lg" : "rounded-bl-lg"}`}
                                        >
                                            <p className="whitespace-pre-wrap text-sm leading-6 wrap-anywhere">{message.text}</p>
                                            <time dateTime={message.createdAt} className="mt-1 block text-right text-[10px] text-gray-300">
                                                {timeFormatter.format(new Date(message.createdAt))}
                                            </time>
                                        </article>
                                    </div>
                                ))}
                            </section>
                        ))}
                    </div>
                )}
            </main>

            <form onSubmit={sendMessage} className="sticky bottom-0 z-50 -mx-6 flex shrink-0 items-center gap-3 border-t border-white/10 bg-dark px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <button
                    type="button"
                    aria-label="Lampirkan file"
                    className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-unguterang"
                >
                    <Paperclip size={23} aria-hidden="true" />
                </button>

                <textarea
                    ref={inputRef}
                    aria-label="Pesan"
                    placeholder="Ketik pesan..."
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                            sendMessage(event);
                        }
                    }}
                    rows={2}
                    className="min-w-0 flex-1 resize-none rounded-3xl border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm leading-6 text-white placeholder:text-gray-400 focus-visible:outline-2 focus-visible:outline-unguterang"
                />

                <button
                    type="submit"
                    aria-label="Kirim pesan"
                    disabled={!draft.trim()}
                    className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-unguterang/15 text-unguterang transition-colors enabled:hover:bg-unguterang/25 focus-visible:outline-2 focus-visible:outline-unguterang disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Send size={20} aria-hidden="true" />
                </button>
            </form>
        </div>
    );
}
