import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function BillingDisclosure() {
  return (
    <section className="px-4 pb-24 pt-3">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex gap-3">
          <span className="mt-0.5 inline-grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-black text-slate-950">Informasi biaya transaksi</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              Topuna hanya memproses pembelian setelah Anda menekan tombol bayar atau konfirmasi. Nominal produk,
              biaya admin, total pembayaran, dan status transaksi selalu ditampilkan sebelum saldo terpotong atau
              pembayaran QRIS/transfer dibuat. Tidak ada langganan otomatis.
            </p>
            <Link href="/ketentuan-transaksi" className="mt-2 inline-flex text-xs font-black text-[#c93450]">
              Lihat ketentuan transaksi
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
