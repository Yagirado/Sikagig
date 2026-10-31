import LoopItems from "../components/CategoryTicker";
import FeatureContainer, {
  type FeatureItem,
} from "../components/FeatureContainer";

const features: FeatureItem[] = [
  {
    title: "Pengguna",
    message: "Mahasiswa yang butuh uang tambahan",
  },
  {
    title: "15%",
    message: "komisi platform yang transparan dari awal",
  },
  {
    title: "KYC opsional",
    message: "badge verified untuk user yang memilih verifikasi",
  },
  {
    title: "Escrow",
    message: "pembayaran ditahan dulu sampai kerjaan selesai",
  },
];

export default function FeatureMetrics() {
  return (
    <section className="min-w-0 py-16 sm:py-20 lg:py-28">
      <LoopItems />
      <FeatureContainer items={features} />
    </section>
  );
}
