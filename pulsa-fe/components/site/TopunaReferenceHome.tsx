import Link from "next/link";
import {
  Bell,
  Bolt,
  Eye,
  FileText,
  Grid3X3,
  History,
  Home,
  Plus,
  ReceiptText,
  Send,
  Smartphone,
  UserRound,
  WalletCards,
  Wifi,
} from "lucide-react";

const assetBase = "/topuna-assets/Topuna_Assets_Pecah";

const services = [
  { label: "Pulsa & Data", href: "/pulsa-data", icon: Smartphone, tone: "bg-rose-50 text-[#f0184f]" },
  { label: "Paket Internet", href: "/paket-data", icon: Wifi, tone: "bg-sky-50 text-[#129fe8]" },
  { label: "Token Listrik", href: "/listrik/token", icon: Bolt, tone: "bg-amber-50 text-[#f6b100]" },
  { label: "E-Wallet", href: "/ewallet", icon: WalletCards, tone: "bg-violet-50 text-[#7b44df]" },
  { label: "Tagihan", href: "/listrik/tagihan", icon: FileText, tone: "bg-emerald-50 text-[#16c59a]" },
  { label: "Lainnya", href: "/kategori", icon: Grid3X3, tone: "bg-slate-100 text-slate-500" },
];

function asset(path: string) {
  return `${assetBase}/${path}`;
}

export function TopunaReferenceHome() {
  return (
    <div className="min-h-dvh bg-[#fff7fa] pb-32 text-[#08132c]">
      <header className="relative overflow-hidden bg-[#c8133f] px-5 pb-10 pt-5 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/12" />
        <div className="pointer-events-none absolute -right-14 top-24 h-56 w-56 rounded-full bg-[#ff6a8c]/45" />
        <div className="pointer-events-none absolute -left-20 top-24 h-44 w-44 rounded-full bg-[#ee3a63]/40" />

        <div className="relative flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3" prefetch={false}>
            <span className="grid h-13 w-13 shrink-0 place-items-center rounded-[18px] border border-white/45 bg-white shadow-[0_10px_24px_rgba(81,7,31,0.18)]">
              <img src="/brand/icon.svg" alt="" className="h-10 w-10" />
            </span>
            <span className="min-w-0">
              <span className="block text-[23px] font-black leading-6">Topuna</span>
              <span className="mt-1 block text-[11px] font-black uppercase tracking-wide">Top Up, Lanjut Lagi</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/login" aria-label="Notifikasi" className="relative grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/12">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-1.5 h-3 w-3 rounded-full bg-cyan-300" />
            </Link>
            <Link href="/login" aria-label="Akun" className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/12">
              <UserRound className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="relative mt-5 flex items-center gap-3">
          <span className="grid h-15 w-15 shrink-0 place-items-center rounded-full border border-white/35 bg-white/18 text-white shadow-[0_12px_26px_rgba(79,7,30,0.18)]">
            <UserRound className="h-8 w-8" strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <p className="text-[28px] font-black leading-tight">Halo, Rina!</p>
            <p className="mt-1 max-w-[250px] text-[15px] font-semibold leading-snug text-white/95">Semoga harimu selalu menyenangkan</p>
          </div>
        </div>
      </header>

      <main className="-mt-8 space-y-5 px-5 pb-8">
        <section className="relative rounded-[22px] bg-white p-5 shadow-[0_16px_40px_rgba(102,21,44,0.14)]">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold text-slate-700">
              <span>Saldo Topuna</span>
              <Eye className="h-4 w-4 text-slate-500" />
            </div>
            <p className="mt-2 whitespace-nowrap text-[42px] font-black leading-none tracking-normal text-[#06122e]">Rp 250.000</p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2.5">
            <Link href="/user/account/topup" className="flex h-13 items-center justify-center gap-1.5 rounded-[18px] bg-[#cf0d3d] px-2 text-sm font-black text-white shadow-[0_10px_20px_rgba(207,13,61,0.20)]" prefetch={false}>
              <Plus className="h-5 w-5" /> Isi Saldo
            </Link>
            <Link href="/user/saldo/kirim" className="flex h-13 items-center justify-center gap-1.5 rounded-[18px] border border-rose-100 bg-rose-50 px-2 text-sm font-black text-[#08132c]" prefetch={false}>
              <Send className="h-5 w-5" /> Transfer
            </Link>
            <Link href="/transaksi" className="flex h-13 items-center justify-center gap-1.5 rounded-[18px] border border-rose-100 bg-rose-50 px-2 text-sm font-black text-[#08132c]" prefetch={false}>
              <ReceiptText className="h-5 w-5" /> Riwayat
            </Link>
          </div>
        </section>

        <Link href="/paket-data" className="relative block min-h-[150px] overflow-hidden rounded-[22px] bg-[#c8133f] px-5 py-5 text-white shadow-[0_14px_36px_rgba(102,21,44,0.14)]" prefetch={false}>
          <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/16" />
          <div className="pointer-events-none absolute -right-2 bottom-0 h-28 w-28 rounded-full bg-[#ff6a8c]/45" />
          <div className="pointer-events-none absolute left-32 top-10 h-20 w-44 -rotate-12 rounded-full border border-white/25" />
          <div className="relative z-10 max-w-[62%]">
            <p className="text-xs font-black uppercase text-white/85">Topuna</p>
            <h2 className="mt-2 text-[25px] font-black leading-[1.05]">Paket Data untuk Koneksi Terbaik</h2>
            <p className="mt-2 text-sm font-semibold leading-snug text-white/88">Internet lancar, aktivitas makin mudah!</p>
            <span className="mt-4 inline-flex h-10 items-center rounded-full bg-white px-5 text-sm font-black text-[#c8133f]">
              Top Up Sekarang
            </span>
          </div>
          <div className="absolute right-5 top-5 grid h-15 w-15 place-items-center rounded-full bg-white/92 text-sky-500 shadow-lg">
            <Wifi className="h-8 w-8" strokeWidth={2.8} />
          </div>
          <div className="absolute right-20 top-16 grid h-13 w-13 place-items-center rounded-full bg-white/88 text-amber-400 shadow-lg">
            <Bolt className="h-7 w-7 fill-current" strokeWidth={2.2} />
          </div>
          <div className="absolute bottom-5 right-9 grid h-14 w-14 place-items-center rounded-full bg-white/90 text-[#f0184f] shadow-lg">
            <Grid3X3 className="h-7 w-7" strokeWidth={2.6} />
          </div>
        </Link>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black">Layanan Favorit</h2>
            <Link href="/kategori" className="text-sm font-semibold text-slate-500" prefetch={false}>Lihat Semua</Link>
          </div>
          <div className="grid grid-cols-6 gap-2.5">
            {services.map((item) => (
              <Link key={item.label} href={item.href} prefetch={false} aria-label={item.label} className="flex aspect-square items-center justify-center rounded-[20px] bg-white shadow-[0_8px_18px_rgba(71,22,39,0.08)] ring-1 ring-rose-100/70 transition hover:-translate-y-0.5">
                <span className={`grid h-10 w-10 place-items-center rounded-full ${item.tone}`}>
                  <item.icon className="h-5.5 w-5.5" strokeWidth={2.5} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[22px] bg-white px-4 py-4 shadow-[0_12px_32px_rgba(102,21,44,0.10)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black">Aktivitas Terakhir</h2>
            <Link href="/transaksi" className="text-sm font-semibold text-slate-500" prefetch={false}>Lihat Semua</Link>
          </div>
          <div className="flex min-h-[96px] items-center gap-3 rounded-[18px] bg-linear-to-r from-rose-50 via-white to-white px-4 py-4 ring-1 ring-rose-100/80">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#cf0d3d] shadow-sm ring-1 ring-rose-100">
              <ReceiptText className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-black text-[#08132c]">Belum ada aktivitas</p>
              <p className="mt-1 text-sm font-semibold leading-snug text-slate-500">Riwayat transaksi akan muncul setelah pembelian pertama.</p>
            </div>
          </div>
        </section>

        <Link href="/kategori" className="block overflow-hidden rounded-[20px]" prefetch={false}>
          <img src={asset("07_promo/promo_banner_full.png")} alt="Cashback spesial untuk kamu" className="block w-full" />
        </Link>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-[90] mx-auto w-full max-w-md border-t border-rose-100/80 bg-white px-4 pb-[calc(0.7rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_28px_rgba(51,24,37,0.10)] md:w-97.5">
        <div className="grid h-[72px] grid-cols-4 gap-2">
          <Link href="/" className="flex h-full flex-col items-center justify-center gap-1.5 rounded-[18px] bg-rose-50 text-[#08132c]" prefetch={false}><Home className="h-6 w-6 fill-current" /><span className="text-xs font-black leading-none">Beranda</span></Link>
          <Link href="/transaksi" className="flex h-full flex-col items-center justify-center gap-1.5 rounded-[18px] text-[#08132c]" prefetch={false}><History className="h-6 w-6" /><span className="text-xs font-black leading-none">Riwayat</span></Link>
          <Link href="/user/saldo" className="flex h-full flex-col items-center justify-center gap-1.5 rounded-[18px] text-[#08132c]" prefetch={false}><WalletCards className="h-6 w-6" /><span className="text-xs font-black leading-none">Saldo</span></Link>
          <Link href="/login" className="flex h-full flex-col items-center justify-center gap-1.5 rounded-[18px] text-[#08132c]" prefetch={false}><UserRound className="h-6 w-6" /><span className="text-xs font-black leading-none">Akun</span></Link>
        </div>
      </nav>
    </div>
  );
}
