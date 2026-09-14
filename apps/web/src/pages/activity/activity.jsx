import ActivityCard from "./ActivityCard";

export default function Test() {
  return (
    <div className="mobile-container text-white">
      {/* Header */}
      <div className="sticky top-0 z-[100] w-full bg-[#151515] px-6 py-3">
        <h1 className="text-2xl font-black">Aktivitas</h1>

        <p className="mt-2 text-sm">
          Kelola gig yang kamu buat, ikuti, dan simpan di sini.
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-4">
        <ActivityCard
          icon="▣"
          title="Gig Kamu"
          description="Lihat gig yang kamu buat dan kelola."
        />

        <ActivityCard
          icon="➤"
          title="Gig yang Kamu Ajukan"
          description="Bid dan spot yang kamu ambil sebagai jagoan."
        />

        <ActivityCard
          icon="▦"
          title="Jasa Saya"
          description="Listing jasa yang kamu tawarkan sebagai jagoan."
        />

        <ActivityCard
          icon="▤"
          title="Order Jasa"
          description="Jasa yang kamu order dan request yang masuk."
        />

        <ActivityCard
          icon="⚠"
          title="Laporkan Masalah"
          description="Laporkan Masalah yang perlu dipantau."
        />

        <ActivityCard
          icon="♡"
          title="Favorites"
          description="Daftar gig dan jasa yang kamu simpan."
        />

        <ActivityCard
          icon="⊘"
          title="Pengguna Diblokir"
          description="Kelola pengguna yang tidak bisa berinteraksi denganmu."
        />
      </div>
    </div>
  );
}
