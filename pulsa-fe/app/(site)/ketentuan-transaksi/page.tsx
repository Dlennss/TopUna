import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ketentuan Transaksi | Topuna",
  description: "Informasi biaya, pembayaran, status transaksi, dan refund di Topuna.",
};

const items = [
  {
    title: "Biaya ditampilkan sebelum bayar",
    text: "Nominal produk, biaya admin bila ada, dan total pembayaran ditampilkan di halaman checkout sebelum pengguna menekan tombol Bayar.",
  },
  {
    title: "Tidak ada langganan otomatis",
    text: "Topuna tidak membuat biaya berulang otomatis. Setiap pembelian, deposit, atau pembayaran tagihan harus dibuat dan dikonfirmasi oleh pengguna.",
  },
  {
    title: "Pembayaran diproses sesuai metode yang dipilih",
    text: "Transaksi dapat memakai saldo Topuna, QRIS, virtual account, atau transfer sesuai metode yang tersedia pada akun dan produk terkait.",
  },
  {
    title: "Refund dan pembatalan",
    text: "Jika transaksi gagal atau dibatalkan sesuai ketentuan sistem, dana dikembalikan ke saldo akun atau diproses melalui alur refund yang tersedia.",
  },
  {
    title: "Data tujuan perlu diperiksa",
    text: "Pastikan nomor tujuan, ID pelanggan, ID game, atau data tagihan sudah benar sebelum membayar karena produk digital diproses berdasarkan data tersebut.",
  },
];

export default function KetentuanTransaksiPage() {
  return (
    <main className="min-h-dvh bg-[#fcf5f7] px-4 py-5">
      <Link href="/" className="text-xs font-black text-[#c93450]">
        Kembali
      </Link>
      <h1 className="mt-4 text-2xl font-black text-slate-950">Ketentuan Transaksi</h1>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        Halaman ini menjelaskan bagaimana biaya dan pembayaran ditampilkan kepada pengguna Topuna.
      </p>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <section key={item.title} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <h2 className="text-sm font-black text-slate-950">{item.title}</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{item.text}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
