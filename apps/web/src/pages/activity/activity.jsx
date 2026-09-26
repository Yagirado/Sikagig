import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import BottomNavbar from "../../components/bottomnavbar";
import ActivityCard from "./ActivityCard";
import GigKamuTab from "./GigKamuTab";
import GigDiajukanTab from "./GigDiajukanTab";
import JasaSayaTab from "./JasaSayaTab";
import OrderJasaTab from "./OrderJasaTab";
import FavoritesTab from "./FavoritesTab";

export default function Activity() {
  // STATE TAB AKTIF (NULL = MENU UTAMA)
  const [activeTab, setActiveTab] = useState(null);

  const TABS = [
    { id: "gig-kamu", label: "Gig Kamu" },
    { id: "gig-diajukan", label: "Gig Diajukan" },
    { id: "jasa-saya", label: "Jasa Saya" },
    { id: "order-jasa", label: "Order Jasa" },
    { id: "favorites", label: "Favorites" },
  ];

  return (
    <div className="mobile-container text-white py-0! min-h-screen pb-28">
      {/* TAMPILAN JIKA SEDANG MEMBUKA SUB-TAB */}
      {activeTab ? (
        <div>
          {/* HEADER DENGAN TOMBOL KEMBALI */}
          <header className="sticky top-0 z-40 bg-[#151515] -mx-6 px-6 pt-5 pb-3 border-b border-gray-800 mb-5">
            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={() => setActiveTab(null)}
                className="absolute left-0 p-2 rounded-2xl bg-dark border border-gray-700 text-gray-300 active:bg-gray-800 active:scale-95 transition-all"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className="text-xl font-black text-white text-center">
                {TABS.find((t) => t.id === activeTab)?.label || "Aktivitas"}
              </h1>
            </div>
          </header>

          {/* KONTEN MASING-MASING TAB */}
          {activeTab === "gig-kamu" && <GigKamuTab />}
          {activeTab === "gig-diajukan" && <GigDiajukanTab />}
          {activeTab === "jasa-saya" && <JasaSayaTab />}
          {activeTab === "order-jasa" && <OrderJasaTab />}
          {activeTab === "favorites" && <FavoritesTab />}
        </div>
      ) : (
        /* MENU UTAMA AKTIVITAS */
        <div>
          {/* HEADER MENU */}
          <header className="sticky top-0 z-20 bg-[#151515] -mx-6 px-6 pt-5 pb-3 border-b border-gray-800 mb-5">
            <h1 className="text-2xl font-black text-white">Aktivitas</h1>
            <p className="mt-1 text-xs text-gray-400">
              Kelola gig yang kamu buat, ikuti, dan pesan di sini.
            </p>
          </header>

          {/* LIST KARTU MENU AKTIVITAS */}
          <div className="flex flex-col gap-3">
            <ActivityCard
              icon="▣"
              title="Gig Kamu"
              description="Kelola gig buatanmu dan seleksi tawaran pelamar."
              onClick={() => setActiveTab("gig-kamu")}
            />

            <ActivityCard
              icon="➤"
              title="Gig yang Kamu Ajukan"
              description="Pantau tawaran bid dan spot yang kamu ambil."
              onClick={() => setActiveTab("gig-diajukan")}
            />

            <ActivityCard
              icon="▦"
              title="Jasa Saya"
              description="Listing jasa yang kamu tawarkan sebagai jagoan."
              onClick={() => setActiveTab("jasa-saya")}
            />

            <ActivityCard
              icon="▤"
              title="Order Jasa"
              description="Pantau pesanan jasa yang kamu order dari jagoan."
              onClick={() => setActiveTab("order-jasa")}
            />

            <ActivityCard
              icon="⚠"
              title="Laporkan Masalah"
              description="Laporkan masalah yang perlu dipantau."
            />

            <ActivityCard
              icon="♡"
              title="Favorites"
              description="Daftar gig dan jasa yang kamu simpan."
              onClick={() => setActiveTab("favorites")}
            />

            <ActivityCard
              icon="⊘"
              title="Pengguna Diblokir"
              description="Kelola pengguna yang tidak bisa berinteraksi denganmu."
            />
          </div>
        </div>
      )}

      {/* BOTTOM NAVBAR */}
      <BottomNavbar />
    </div>
  );
}
