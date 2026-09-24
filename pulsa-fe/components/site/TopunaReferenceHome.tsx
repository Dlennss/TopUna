import Link from "next/link";
import {
  Bell,
  Bolt,
  CreditCard,
  Eye,
  FileText,
  Grid3X3,
  History,
  Home,
  Plus,
  ReceiptText,
  Send,
  ShieldCheck,
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

const activities = [
  { title: "Beli Paket Data", sub: "Telkomsel · 10 GB", amount: "- Rp 50.000", date: "12 Mar 2025, 14:32", icon: Wifi, tone: "bg-sky-50 text-[#129fe8]" },
  { title: "Token Listrik", sub: "PLN · 50.000", amount: "- Rp 50.000", date: "11 Mar 2025, 20:17", icon: Bolt, tone: "bg-amber-50 text-[#f6b100]" },
  { title: "Top Up E-Wallet", sub: "OVO · Top Up Saldo", amount: "- Rp 100.000", date: "10 Mar 2025, 09:21", icon: CreditCard, tone: "bg-violet-50 text-[#7040d8]" },
];

function asset(path: string) {
  return `${assetBase}/${path}`;
}

export function TopunaReferenceHome() {
  return (
    <div className="min-h-dvh bg-[#fff7fa] pb-24 text-[#08132c]">
      <header className="relative overflow-hidden bg-[#c8133f] px-5 pb-11 pt-5 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/12" />
        <div className="pointer-events-none absolute -right-14 top-24 h-56 w-56 rounded-full bg-[#ff6a8c]/45" />
        <div className="pointer-events-none absolute -left-20 top-24 h-44 w-44 rounded-full bg-[#ee3a63]/40" />

        <div className="relative flex items-start justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3" prefetch={false}>
            <img src={asset("01_header/logo_symbol.png")} alt="" className="h-14 w-14 shrink-0" />
            <span className="min-w-0">
              <span className="block text-2xl font-black leading-6">Topuna</span>
              <span className="mt-1 block text-xs font-black uppercase tracking-wide">Top Up, Lanjut Lagi</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/login" aria-label="Notifikasi" className="relative grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-white/12">
              <Bell className="h-6 w-6" />
              <span className="absolute right-2 top-1.5 h-3.5 w-3.5 rounded-full bg-cyan-300" />
            </Link>
            <Link href="/login" aria-label="Akun" className="grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-white/12">
              <UserRound className="h-6 w-6" />
            </Link>
          </div>
        </div>

        <div className="relative mt-5 flex items-center gap-4">
          <span className="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full border border-white/35 bg-white/18 text-white shadow-[0_12px_26px_rgba(79,7,30,0.18)]">
            <UserRound className="h-9 w-9" strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <p className="text-3xl font-black leading-tight">Halo, Rina!</p>
            <p className="mt-1 text-base font-semibold leading-snug text-white/95">Semoga harimu selalu menyenangkan</p>
          </div>
        </div>
      </header>

      <main className="-mt-8 space-y-5 px-5">
        <section className="relative rounded-[22px] bg-white p-5 shadow-[0_16px_40px_rgba(102,21,44,0.14)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-base font-semibold text-slate-700">
                <span>Saldo Topuna</span>
                <Eye className="h-4 w-4 text-slate-500" />
              </div>
              <p className="mt-2 text-[40px] font-black leading-none tracking-normal text-[#06122e]">Rp 250.000</p>
            </div>
            <div className="hidden items-center gap-2 rounded-2xl bg-sky-50 px-3 py-2 sm:flex">
              <ShieldCheck className="h-8 w-8 text-sky-600" />
              <span className="text-xs font-bold leading-tight text-slate-700">Aman & Praktis<br /><span className="font-semibold text-slate-500">Transaksi 100% Terjamin</span></span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <Link href="/user/account/topup" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#cf0d3d] text-sm font-black text-white" prefetch={false}>
              <Plus className="h-5 w-5" /> Isi Saldo
            </Link>
            <Link href="/user/saldo/kirim" className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 text-sm font-black text-[#cf0d3d]" prefetch={false}>
              <Send className="h-5 w-5" /> Transfer
            </Link>
            <Link href="/transaksi" className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 text-sm font-black text-[#cf0d3d]" prefetch={false}>
              <ReceiptText className="h-5 w-5" /> Riwayat
            </Link>
          </div>
        </section>

        <Link href="/paket-data" className="block overflow-hidden rounded-[20px] shadow-[0_14px_36px_rgba(102,21,44,0.12)]" prefetch={false}>
          <img src={asset("03_banner/hero_banner_full.png")} alt="Paket Data untuk Koneksi Terbaik" className="block w-full" />
        </Link>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black">Layanan Favorit</h2>
            <Link href="/kategori" className="text-sm font-semibold text-slate-500" prefetch={false}>Lihat Semua</Link>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {services.map((item) => (
              <Link key={item.label} href={item.href} prefetch={false} aria-label={item.label} className="flex min-h-[78px] items-center justify-center rounded-[18px] border border-rose-100/80 bg-white px-2 text-center shadow-[0_6px_16px_rgba(71,22,39,0.08)] transition hover:-translate-y-0.5">
                <span className={`grid h-13 w-13 place-items-center rounded-2xl ${item.tone}`}>
                  <item.icon className="h-7 w-7" strokeWidth={2.5} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[20px] bg-white px-4 py-4 shadow-[0_12px_32px_rgba(102,21,44,0.10)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black">Aktivitas Terakhir</h2>
            <Link href="/transaksi" className="text-sm font-semibold text-slate-500" prefetch={false}>Lihat Semua</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {activities.map((item) => (
              <div key={item.title} className="flex items-center gap-3 py-3">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${item.tone}`}>
                  <item.icon className="h-7 w-7" strokeWidth={2.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-black">{item.title}</p>
                  <p className="truncate text-sm font-semibold text-slate-500">{item.sub}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-black">{item.amount}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Link href="/kategori" className="block overflow-hidden rounded-[20px]" prefetch={false}>
          <img src={asset("07_promo/promo_banner_full.png")} alt="Cashback spesial untuk kamu" className="block w-full" />
        </Link>
      </main>

      <nav className="fixed bottom-0 left-1/2 z-[90] w-full max-w-md -translate-x-1/2 rounded-t-[28px] border border-white/80 bg-white/95 px-4 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-14px_34px_rgba(51,24,37,0.14)] backdrop-blur-xl md:w-97.5">
        <div className="grid grid-cols-4 gap-1">
          <Link href="/" className="flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl bg-rose-50 text-[#f20d3e]" prefetch={false}><Home className="h-6 w-6 fill-current" /><span className="text-xs font-black">Beranda</span></Link>
          <Link href="/transaksi" className="flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-slate-500" prefetch={false}><History className="h-6 w-6" /><span className="text-xs font-bold">Riwayat</span></Link>
          <Link href="/user/saldo" className="flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-slate-500" prefetch={false}><WalletCards className="h-6 w-6" /><span className="text-xs font-bold">Saldo</span></Link>
          <Link href="/login" className="flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-slate-500" prefetch={false}><UserRound className="h-6 w-6" /><span className="text-xs font-bold">Akun</span></Link>
        </div>
      </nav>
    </div>
  );
}
