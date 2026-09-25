"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, House, UserRound, WalletCards } from "lucide-react";

function navClass(active: boolean) {
  return active
    ? "flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-[18px] bg-rose-50 py-2 text-[#08132c]! visited:text-[#08132c]!"
    : "flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-[18px] py-2 text-[#08132c]! transition visited:text-[#08132c]! hover:bg-rose-50 hover:text-[#cf0d3d]!";
}

function isActivePath(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

const iconClass = "h-6 w-6";
const textClass = "text-xs font-black leading-none";

export function UserBottomNav() {
  const pathname = usePathname() || "";
  const trxActive = isActivePath(pathname, "/user/transaksi");
  const saldoActive = isActivePath(pathname, "/user/saldo") || isActivePath(pathname, "/user/account/topup") || isActivePath(pathname, "/user/account/mutasi");
  const accountActive = isActivePath(pathname, "/user/account") && !saldoActive;
  const homeActive = isActivePath(pathname, "/user") && !trxActive && !accountActive && !saldoActive;

  return (
    <section className="brand-bottom-nav fixed bottom-0 left-1/2 z-[90] w-full max-w-md -translate-x-1/2 overflow-hidden rounded-t-[24px] border-t border-rose-100 bg-white shadow-[0_-10px_28px_rgba(51,24,37,0.10)] md:bottom-0 md:w-97.5 md:max-w-none">
      <div className="grid h-[72px] grid-cols-4 gap-2 px-4 pb-[calc(0.7rem+env(safe-area-inset-bottom))] pt-3">
        <Link href="/user" className={navClass(homeActive)}>
          <House className={homeActive ? `${iconClass} fill-current` : iconClass} strokeWidth={1.9} />
          <span className={textClass}>Beranda</span>
        </Link>

        <Link href="/user/transaksi" className={navClass(trxActive)}>
          <History className={iconClass} strokeWidth={1.9} />
          <span className={textClass}>Riwayat</span>
        </Link>

        <Link href="/user/saldo" className={navClass(saldoActive)}>
          <WalletCards className={iconClass} strokeWidth={1.9} />
          <span className={textClass}>Saldo</span>
        </Link>

        <Link href="/user/account" className={navClass(accountActive)}>
          <UserRound className={iconClass} strokeWidth={1.9} />
          <span className={textClass}>Akun</span>
        </Link>
      </div>
    </section>
  );
}
