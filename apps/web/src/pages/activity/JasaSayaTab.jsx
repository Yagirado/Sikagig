import { useState, useEffect } from "react";
import { Edit3, Trash2, ShoppingBag } from "lucide-react";
import { getCategoryIcon } from "../../lib/categories";
import EditJasaModal from "./EditJasaModal";

export default function JasaSayaTab() {
    const [jasas, setJasas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEdit, setSelectedEdit] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // FETCH JASA SAYA
    useEffect(() => {
        let ignore = false;
        async function fetchMyJasas() {
            try {
                const res = await fetch("/api/my-jasas", {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });
                const data = await res.json();
                if (!ignore && res.ok) {
                    setJasas(data.jasas || []);
                }
            } catch {
                // SILENT ERROR
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        fetchMyJasas();
        return () => {
            ignore = true;
        };
    }, [refreshKey]);

    // TOGGLE STATUS JASA (AKTIF / NONAKTIF)
    const handleToggleStatus = async (id) => {
        setActionLoadingId(id);
        try {
            const res = await fetch(`/api/jasas/${id}/toggle-status`, {
                method: "PATCH",
                credentials: "include",
                headers: { Accept: "application/json" },
            });
            const data = await res.json();
            if (res.ok) {
                setJasas((prev) =>
                    prev.map((j) => (j.id === id ? { ...j, status: data.status } : j))
                );
            } else {
                alert(data.message || "Gagal mengubah status jasa.");
            }
        } catch {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setActionLoadingId(null);
        }
    };

    // HAPUS JASA
    const handleDelete = async (id) => {
        if (!window.confirm("Apakah kamu yakin ingin menghapus listing jasa ini?")) return;

        setActionLoadingId(id);
        try {
            const res = await fetch(`/api/jasas/${id}`, {
                method: "DELETE",
                credentials: "include",
                headers: { Accept: "application/json" },
            });
            const data = await res.json();
            if (res.ok) {
                setJasas((prev) => prev.filter((j) => j.id !== id));
            } else {
                alert(data.message || "Gagal menghapus jasa.");
            }
        } catch {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setActionLoadingId(null);
        }
    };

    if (loading) {
        return <p className="text-center text-sm text-gray-400 py-12">Memuat etalase jasa kamu...</p>;
    }

    if (jasas.length === 0) {
        return (
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-gray-800 bg-[#161618]">
                <p className="font-bold text-gray-300">Belum ada jasa yang kamu tawarkan</p>
                <p className="text-xs text-gray-500 mt-1">Buka lapak jasamu lewat menu Nawarin Jasa di dashboard.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* DAFTAR CARD JASA SAYA */}
            {jasas.map((jasa) => {
                const isActive = (jasa.status || "active") === "active";
                const ordersCount = jasa.orders_count || 0;

                return (
                    <article
                        key={jasa.id}
                        className="h-fit w-auto bg-dark rounded-3xl border border-unguterang shadow-[0_0_16px_0] shadow-unguterang/20"
                    >
                        {/* KATEGORI & STATUS TOGGLE */}
                        <div className="flex items-center justify-between my-4 mx-4">
                            <span className="inline-flex items-center gap-4 rounded-full bg-light/50 px-3 py-2 text-xs font-black tracking-wider text-white">
                                <span className="relative h-3 w-3 shrink-0 ml-1.5">
                                    <img
                                        src={getCategoryIcon(jasa.category)}
                                        alt=""
                                        className="absolute left-1/2 top-1/2 h-9 w-9 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
                                    />
                                </span>
                                {jasa.category || "Jasa"}
                            </span>
                            <button
                                type="button"
                                disabled={actionLoadingId === jasa.id}
                                onClick={() => handleToggleStatus(jasa.id)}
                                className={`border uppercase tracking-wider text-[10px] font-black rounded-full px-2.5 py-1 active:scale-95 transition-all disabled:opacity-50 ${
                                    isActive
                                        ? "bg-green-500/15 border-green-500/60 text-green-400"
                                        : "bg-gray-800 border-gray-700 text-gray-400"
                                }`}
                            >
                                {isActive ? "● Aktif" : "○ Nonaktif"}
                            </button>
                        </div>

                        {/* JUDUL & DESKRIPSI */}
                        <div className="flex flex-col gap-1 mx-4 text-white">
                            <div className="mt-2">
                                <h2 className="wrap-break-words text-lg font-extrabold leading-snug">
                                    {jasa.name}
                                </h2>

                                {jasa.description && (
                                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-300">
                                        {jasa.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* USER & HARGA */}
                        <div className="flex items-center justify-between mx-4 mt-4 pb-4 border-b border-gray-700">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ungu">
                                    <ShoppingBag size={18} className="text-white" />
                                </div>
                                <span className="text-white wrap-break-words text-xs">
                                    {ordersCount} Pesanan Masuk
                                </span>
                            </div>
                            <div className="ml-auto shrink-0 text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Mulai Dari
                                </p>
                                <p className="mt-0.5 text-xl font-black text-unguterang">
                                    {Number(jasa.price).toLocaleString("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                        maximumFractionDigits: 0,
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* FOOTER: PAKET INFO & AKSI */}
                        <div className="flex items-center justify-between py-4 mx-4 text-xs font-semibold text-gray-400">
                            <span className="text-[11px] text-gray-400">
                                {jasa.packages?.length || 1} Pilihan Paket
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedEdit(jasa)}
                                    className="p-2 rounded-xl bg-[#2a2a2a] text-gray-300 active:scale-95 transition-all"
                                    title="Edit Jasa"
                                >
                                    <Edit3 size={14} />
                                </button>
                                <button
                                    type="button"
                                    disabled={actionLoadingId === jasa.id}
                                    onClick={() => handleDelete(jasa.id)}
                                    className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 active:scale-95 transition-all disabled:opacity-50"
                                    title="Hapus Jasa"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </article>
                );
            })}

            {/* MODAL EDIT JASA */}
            {selectedEdit && (
                <EditJasaModal
                    jasa={selectedEdit}
                    onClose={() => setSelectedEdit(null)}
                    onRefresh={() => setRefreshKey((k) => k + 1)}
                />
            )}
        </div>
    );
}
