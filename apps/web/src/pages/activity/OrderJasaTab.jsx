import { useState, useEffect } from "react";
import { Edit3, XCircle, UserRound } from "lucide-react";
import { getCategoryIcon } from "../../lib/categories";
import EditOrderBriefModal from "./EditOrderBriefModal";

export default function OrderJasaTab() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEdit, setSelectedEdit] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // FETCH PESANAN JASA SAYA
    useEffect(() => {
        let ignore = false;
        async function fetchMyOrders() {
            try {
                const res = await fetch("/api/my-orders", {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });
                const data = await res.json();
                if (!ignore && res.ok) {
                    setOrders(data.orders || []);
                }
            } catch {
                // SILENT ERROR
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        fetchMyOrders();
        return () => {
            ignore = true;
        };
    }, [refreshKey]);

    // BATALKAN PESANAN
    const handleCancelOrder = async (id) => {
        if (!window.confirm("Apakah kamu yakin ingin membatalkan pesanan jasa ini?")) return;

        setActionLoadingId(id);
        try {
            const res = await fetch(`/api/orders/${id}/cancel`, {
                method: "DELETE",
                credentials: "include",
                headers: { Accept: "application/json" },
            });
            const data = await res.json();
            if (res.ok) {
                setOrders((prev) =>
                    prev.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o))
                );
            } else {
                alert(data.message || "Gagal membatalkan pesanan.");
            }
        } catch {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setActionLoadingId(null);
        }
    };

    if (loading) {
        return <p className="text-center text-sm text-gray-400 py-12">Memuat pesanan jasa kamu...</p>;
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-gray-800 bg-[#161618]">
                <p className="font-bold text-gray-300">Belum ada jasa yang kamu pesan</p>
                <p className="text-xs text-gray-500 mt-1">Jelajahi etalase jasa di dashboard dan order jagoan terbaik.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* DAFTAR CARD PESANAN JASA */}
            {orders.map((order) => {
                const isPending = order.status === "pending";
                const isProgress = order.status === "in_progress";
                const isCompleted = order.status === "completed";

                const statusColor = isPending
                    ? "bg-yellow-500/15 border-yellow-500/60 text-yellow-400"
                    : isProgress
                    ? "bg-blue-500/15 border-blue-500/60 text-blue-400"
                    : isCompleted
                    ? "bg-green-500/15 border-green-500/60 text-green-400"
                    : "bg-red-500/15 border-red-500/60 text-red-400";

                const statusLabel = isPending
                    ? "Menunggu Konfirmasi"
                    : isProgress
                    ? "Sedang Dikerjakan"
                    : isCompleted
                    ? "Selesai"
                    : "Dibatalkan";

                return (
                    <article
                        key={order.id}
                        className="h-fit w-auto bg-dark rounded-3xl border border-unguterang shadow-[0_0_16px_0] shadow-unguterang/20"
                    >
                        {/* KATEGORI & STATUS BADGE */}
                        <div className="flex items-center justify-between my-4 mx-4">
                            <span className="inline-flex items-center gap-4 rounded-full bg-light/50 px-3 py-2 text-xs font-black tracking-wider text-white">
                                <span className="relative h-3 w-3 shrink-0 ml-1.5">
                                    <img
                                        src={getCategoryIcon(order.jasa?.category)}
                                        alt=""
                                        className="absolute left-1/2 top-1/2 h-9 w-9 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
                                    />
                                </span>
                                {order.jasa?.category || "Jasa"}
                            </span>
                            <span className={`border uppercase tracking-wider text-[10px] font-black rounded-full px-2.5 py-1 ${statusColor}`}>
                                {statusLabel}
                            </span>
                        </div>

                        {/* JUDUL & CATATAN BRIEF */}
                        <div className="flex flex-col gap-1 mx-4 text-white">
                            <div className="mt-2">
                                <h2 className="wrap-break-words text-lg font-extrabold leading-snug">
                                    {order.jasa?.name || "Layanan Jasa"}
                                </h2>

                                {order.brief_notes && (
                                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-300 italic">
                                        "{order.brief_notes}"
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* USER & HARGA */}
                        <div className="flex items-center justify-between mx-4 mt-4 pb-4 border-b border-gray-700">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ungu">
                                    <UserRound size={20} className="text-white" />
                                </div>
                                <span className="text-white wrap-break-words text-xs">
                                    Jagoan: {order.seller?.fullName || "Penyedia Jasa"}
                                </span>
                            </div>
                            <div className="ml-auto shrink-0 text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Total Harga
                                </p>
                                <p className="mt-0.5 text-xl font-black text-unguterang">
                                    {Number(order.price).toLocaleString("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                        maximumFractionDigits: 0,
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* FOOTER: PAKET & AKSI */}
                        <div className="flex items-center justify-between py-4 mx-4 text-xs font-semibold text-gray-400">
                            <span className="text-[11px] text-gray-400">
                                Paket: {order.package_name || "Standar"}
                            </span>

                            {isPending && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedEdit(order)}
                                        className="px-3 py-1.5 rounded-full text-xs font-bold bg-unguterang/15 border border-unguterang text-unguterang active:scale-95 transition-transform flex items-center gap-1.5"
                                    >
                                        <Edit3 size={13} />
                                        <span>Ubah Brief</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionLoadingId === order.id}
                                        onClick={() => handleCancelOrder(order.id)}
                                        className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        <XCircle size={13} />
                                        <span>Batalkan</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </article>
                );
            })}

            {/* MODAL EDIT BRIEF */}
            {selectedEdit && (
                <EditOrderBriefModal
                    order={selectedEdit}
                    onClose={() => setSelectedEdit(null)}
                    onRefresh={() => setRefreshKey((k) => k + 1)}
                />
            )}
        </div>
    );
}
