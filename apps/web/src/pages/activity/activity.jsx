import { useState } from "react";
import { ArrowLeft, ArrowUpDown, Check } from "lucide-react";
import BottomNavbar from "../../components/bottomnavbar";
import ActivityCard from "./ActivityCard";
import GigKamuTab from "./GigKamuTab";
import GigDiajukanTab from "./GigDiajukanTab";
import JasaSayaTab from "./JasaSayaTab";
import OrderJasaTab from "./OrderJasaTab";
import FavoritesTab from "./FavoritesTab";
import { CATEGORIES } from "../../lib/categories";

const CATEGORIES_WITH_ALL = [{ name: "Semua" }, ...CATEGORIES];

export default function Activity() {
  // STATE TAB AKTIF (NULL = MENU UTAMA)
  const [activeTab, setActiveTab] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc' = TERBARU, 'asc' = TERLAMA
  const [showSortMenu, setShowSortMenu] = useState(false);

  const TABS = [
    { id: "gig-kamu", label: "Gig Kamu" },
    { id: "gig-diajukan", label: "Gig Diajukan" },
    { id: "jasa-saya", label: "Jasa Saya" },
    { id: "order-jasa", label: "Order Jasa" },
    { id: "favorites", label: "Favorites" },
  ];

  const showFilterBar = ["gig-kamu", "gig-diajukan", "jasa-saya", "order-jasa"].includes(activeTab);

  return (
    <div className="mobile-container text-white py-0! min-h-screen pb-28">
      {/* TAMPILAN JIKA SEDANG MEMBUKA SUB-TAB */}
      {activeTab ? (
        <div>
          {/* HEADER DENGAN TOMBOL KEMBALI & BAR KATEGORI/SORT */}
          <header className="sticky top-0 z-40 bg-[#151515] -mx-6 px-6 pt-4 pb-2 border-b border-gray-800 mb-5">
            {/* ROW JUDUL & KEMBALI */}
            <div className="relative flex items-center justify-center pb-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab(null);
                  setSelectedCategory("Semua");
                  setSortOrder("desc");
                }}
                className="absolute left-0 p-2 rounded-2xl bg-dark border border-gray-700 text-gray-300 active:bg-gray-800 active:scale-95 transition-all"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className="text-xl font-black text-white text-center">
                {TABS.find((t) => t.id === activeTab)?.label || "Aktivitas"}
              </h1>
            </div>

            {/* BAR KATEGORI & SORT */}
            {showFilterBar && (
              <div className="flex items-center gap-2 pt-1 border-t border-gray-800/80">
                {/* KATEGORI HORIZONTAL SCROLL */}
                <div className="flex-1 flex overflow-x-auto scrollbar-width:none [&::-webkit-scrollbar]:hidden">
                  {CATEGORIES_WITH_ALL.map((category) => {
                    const isActive = selectedCategory === category.name;
                    return (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() => setSelectedCategory(category.name)}
                        className={`relative shrink-0 whitespace-nowrap px-3 pb-2 pt-1.5 font-bold text-sm cursor-pointer transition-colors ${
                          isActive ? "text-unguterang" : "text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        {category.name}
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="absolute bottom-0 left-1/2 h-[3.5px] w-8 -translate-x-1/2 rounded-full bg-unguterang"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* PEMISAH / DIVIDER */}
                <div className="h-5 w-[1px] bg-gray-800 shrink-0" />

                {/* TOMBOL SORT TERBARU / TERLAMA DI PALING KANAN (TIDAK IKUT SCROLL) */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowSortMenu((prev) => !prev)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#1e1e1e] border border-gray-700 text-xs font-bold text-gray-200 active:scale-95 transition-all"
                  >
                    <ArrowUpDown size={13} className="text-unguterang shrink-0" />
                    <span className="text-[11px] whitespace-nowrap">
                      {sortOrder === "desc" ? "Terbaru" : "Terlama"}
                    </span>
                  </button>

                  {showSortMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowSortMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-44 bg-[#1e1e1e] border border-gray-800 rounded-2xl shadow-2xl z-50 py-1.5 overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setSortOrder("desc");
                            setShowSortMenu(false);
                          }}
                          className={`w-full px-3.5 py-2.5 text-left font-bold flex items-center justify-between transition-colors ${
                            sortOrder === "desc"
                              ? "text-unguterang bg-ungu/10"
                              : "text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          <span>Terbaru ke Terlama</span>
                          {sortOrder === "desc" && <Check size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSortOrder("asc");
                            setShowSortMenu(false);
                          }}
                          className={`w-full px-3.5 py-2.5 text-left font-bold flex items-center justify-between transition-colors ${
                            sortOrder === "asc"
                              ? "text-unguterang bg-ungu/10"
                              : "text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          <span>Terlama ke Terbaru</span>
                          {sortOrder === "asc" && <Check size={14} />}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </header>

          {/* KONTEN MASING-MASING TAB */}
          {activeTab === "gig-kamu" && (
            <GigKamuTab category={selectedCategory} sortOrder={sortOrder} />
          )}
          {activeTab === "gig-diajukan" && (
            <GigDiajukanTab category={selectedCategory} sortOrder={sortOrder} />
          )}
          {activeTab === "jasa-saya" && (
            <JasaSayaTab category={selectedCategory} sortOrder={sortOrder} />
          )}
          {activeTab === "order-jasa" && (
            <OrderJasaTab category={selectedCategory} sortOrder={sortOrder} />
          )}
          {activeTab === "favorites" && <FavoritesTab />}
        </div>
      ) : (
        /* MENU UTAMA AKTIVITAS */
        <div>
          {/* HEADER MENU */}
          <div className="pt-8 pb-2 mb-6">
            <h1 className="text-2xl font-bold text-white">Aktivitas</h1>
            <p className="mt-2 text-xs text-gray-400">
              Kelola gig yang kamu buat, ikuti, dan pesan di sini.
            </p>
          </div>

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
