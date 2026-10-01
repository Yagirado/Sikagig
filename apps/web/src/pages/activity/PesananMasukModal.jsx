import { useState, useEffect } from "react";
import { X, Check, MessageSquare, AlertCircle, Gauge } from "lucide-react";
import { useNavigate } from "react-router";
import { getCsrfToken } from "../../lib/api";
import UpdateOrderProgressModal from "./UpdateOrderProgressModal";

export default function PesananMasukModal({ jasaId, onClose, onRefresh }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [selectedProgressOrder, setSelectedProgressOrder] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const navigate = useNavigate();

    // FETCH PESANAN MASUK DARI BACKEND
    useEffect(() => {
        const controller = new AbortController();

        async function fetchOrders() {
            try {
                const res = await fetch(`/api/jasas/${jasaId}/orders`, {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                    signal: controller.signal,
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || "Gagal memuat pesanan masuk.");
                }

                if (!controller.signal.aborted) {
                    setOrders(data.orders || []);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setErrorMsg(error.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void fetchOrders();

        return () => controller.abort();
    }, [jasaId, refreshKey]);

    // TERIMA PESANAN OLEH PENJUAL
    const handleAccept = async (orderId) => {
        setActionLoadingId(orderId);

        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch(`/api/orders/${orderId}/accept`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Gagal menerima pesanan.");
            }

            onRefresh?.();
            onClose();

            if (data.conversation_id) {
                navigate(`/chats/room/${data.conversation_id}`);
            }
        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
            <div className="w-full max-w-md bg-[#18181b] border border-gray-800 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col text-white">
                
                {/* HEADER MODAL */}
                <div className="flex items-center justify-between p-5 border-b border-gray-800">
                    <div>
                        <h2 className="text-lg font-black">Pesanan Masuk ({orders.length})</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Konfirmasi dan kelola progres pesanan pelanggan</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-gray-800 text-gray-400 active:scale-95 transition-transform"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* BODY MODAL */}
                <div className="p-4 overflow-y-auto flex-1 space-y-3">
                    {loading && (
                        <p className="text-center text-sm text-gray-400 py-8">Memuat pesanan...</p>
                    )}

                    {errorMsg && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                            <AlertCircle size={16} />
                            {errorMsg}
                        </div>
                    )}

                    {!loading && !errorMsg && orders.length === 0 && (
                        <div className="text-center py-10">
                            <p className="font-bold text-gray-300">Belum ada pesanan masuk</p>
                            <p className="text-xs text-gray-500 mt-1">Pesanan dari mahasiswa lain akan muncul di sini.</p>
                        </div>
                    )}

                    {orders.map((order) => {
                        const isPending = order.status === "pending";
                        const isInProgress = order.status === "in_progress";
                        const isCompleted = order.status === "completed";
                        const progressVal = isCompleted ? 100 : (order.progress ?? 0);

                        return (
                            <div
                                key={order.id}
                                className={`p-4 rounded-2xl border ${
                                    isPending
                                        ? "bg-yellow-500/5 border-yellow-500/30"
                                        : isInProgress
                                        ? "bg-blue-500/5 border-blue-500/30"
                                        : isCompleted
                                        ? "bg-green-500/5 border-green-500/30"
                                        : "bg-[#141416] border-gray-800"
                                } flex flex-col gap-3`}
                            >
                                {/* PROFIL PEMBELI & TOTAL BAYAR */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-sm text-white">
                                            {order.buyer?.fullName || "Pelanggan"}
                                        </h3>
                                        <p className="text-[11px] text-gray-400">
                                            Paket: {order.package_name || "Standar"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-gray-400 block">Total Bayar</span>
                                        <span className="text-sm font-black text-unguterang">
                                            Rp {Number(order.price).toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                </div>

                                {/* CATATAN BRIEF DARI PEMBELI */}
                                {order.brief_notes && (
                                    <div className="bg-[#1e1e24] p-3 rounded-xl border border-gray-800/80">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                                            Catatan Brief Pembeli:
                                        </span>
                                        <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                                            "{order.brief_notes}"
                                        </p>
                                    </div>
                                )}

                                {/* BAR PROGRES PENGERJAAN (UNTUK IN_PROGRESS & COMPLETED) */}
                                {(isInProgress || isCompleted) && (
                                    <div className="bg-[#121214] p-3 rounded-xl border border-gray-800/80 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400 font-bold flex items-center gap-1">
                                                <Gauge size={13} className="text-unguterang" /> Progres Kerja
                                            </span>
                                            <span className="font-black text-unguterang">{progressVal}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                    isCompleted
                                                        ? "bg-green-500"
                                                        : "bg-gradient-to-r from-ungu to-unguterang"
                                                }`}
                                                style={{ width: `${progressVal}%` }}
                                            />
                                        </div>

                                        {/* CATATAN UPDATE PROGRES TERAKHIR ATAU INFO PENYELESAIAN */}
                                        {isCompleted ? (
                                            <p className="text-[11px] text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-2.5 py-1.5 rounded-xl">
                                                🎉 Pesanan Selesai • Pendapatan +Rp {Number(order.price).toLocaleString("id-ID")} telah masuk ke Dompet!
                                            </p>
                                        ) : order.progress_notes ? (
                                            <p className="text-[11px] text-gray-300 bg-gray-900/60 p-2 rounded-lg border border-gray-800 italic">
                                                &quot;{order.progress_notes}&quot;
                                            </p>
                                        ) : null}
                                    </div>
                                )}

                                {/* STATUS & TOMBOL AKSI */}
                                <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                                    <span
                                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                            isPending
                                                ? "bg-yellow-500/20 text-yellow-400"
                                                : isInProgress
                                                ? "bg-blue-500/20 text-blue-400"
                                                : isCompleted
                                                ? "bg-green-500/20 text-green-400"
                                                : "bg-red-500/20 text-red-400"
                                        }`}
                                    >
                                        {isPending
                                            ? "Menunggu Konfirmasi"
                                            : isInProgress
                                            ? "Sedang Dikerjakan"
                                            : isCompleted
                                            ? "Selesai"
                                            : "Dibatalkan"}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        {isPending && (
                                            <button
                                                disabled={actionLoadingId === order.id}
                                                onClick={() => handleAccept(order.id)}
                                                className="px-4 py-1.5 text-xs font-bold text-white bg-ungu rounded-xl active:bg-unguterang active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-ungu/20"
                                            >
                                                <Check size={14} />
                                                <span>Terima Pesanan</span>
                                            </button>
                                        )}

                                        {(isInProgress || isCompleted) && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedProgressOrder(order)}
                                                    className="px-3 py-1.5 text-xs font-bold text-unguterang bg-ungu/20 border border-unguterang/50 rounded-xl active:scale-95 transition-all flex items-center gap-1"
                                                >
                                                    <Gauge size={13} />
                                                    <span>Update Progres</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onClose();
                                                        navigate("/chats");
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-bold text-gray-300 bg-gray-800 border border-gray-700 rounded-xl active:scale-95 transition-all flex items-center gap-1"
                                                >
                                                    <MessageSquare size={13} />
                                                    <span>Chat</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL UPDATE PROGRES ORDER */}
            {selectedProgressOrder && (
                <UpdateOrderProgressModal
                    order={selectedProgressOrder}
                    onClose={() => setSelectedProgressOrder(null)}
                    onRefresh={() => {
                        setRefreshKey((k) => k + 1);
                        onRefresh?.();
                    }}
                />
            )}
        </div>
    );
}

