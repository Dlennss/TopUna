"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, House, UserRound, WalletCards } from "lucide-react";
import styles from "./RetailBottomNav.module.css";

function isWithin(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function RetailBottomNav({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const pathname = usePathname() || "/";
  const historyActive = isWithin(pathname, "/transaksi") || isWithin(pathname, "/user/transaksi");
  const saldoActive = isWithin(pathname, "/user/saldo")
    || isWithin(pathname, "/user/account/topup")
    || isWithin(pathname, "/user/account/mutasi");
  const accountActive = !saldoActive && (isWithin(pathname, "/user/account")
    || isWithin(pathname, "/login") || isWithin(pathname, "/register"));
  const items = [
    { label: "Beranda", href: isLoggedIn ? "/user" : "/", icon: House, active: !historyActive && !saldoActive && !accountActive },
    { label: "Riwayat", href: isLoggedIn ? "/user/transaksi" : "/transaksi", icon: History, active: historyActive },
    { label: "Saldo", href: isLoggedIn ? "/user/saldo" : "/login", icon: WalletCards, active: saldoActive },
    { label: "Akun", href: isLoggedIn ? "/user/account" : "/login", icon: UserRound, active: accountActive },
  ];

  return (
    <nav aria-label="Navigasi utama" data-topuna-main-nav="true" className={styles.nav}>
      <div className={styles.items}>
        {items.map(({ label, href, icon: Icon, active }) => (
          <Link key={label} href={href} prefetch={false} className={styles.link} aria-current={active ? "page" : undefined}>
            <span className={styles.icon}><Icon size={22} strokeWidth={1.8} aria-hidden="true" /></span>
            <span className={styles.label}>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
