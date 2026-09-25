import Link from "next/link";
import { Headset, Zap } from "lucide-react";

type AppTopHeaderProps = {
  isLoggedIn?: boolean;
  userName?: string | null;
  saldo?: number | null;
  role?: string | null;
};

export function AppTopHeader({ isLoggedIn = false, userName, saldo, role }: AppTopHeaderProps) {
  const normalizedRole = String(role || "").trim().toLowerCase();
  const isRetailLoggedIn = isLoggedIn && (normalizedRole === "user" || normalizedRole === "agent" || normalizedRole === "master");
  const homeHref = isRetailLoggedIn ? "/user" : "/";
  void userName;
  void saldo;

  return (
    <header className="brand-app-header sticky top-0 z-30 overflow-hidden bg-[#c8133f] px-4 pb-3 pt-3 text-white shadow-[0_16px_34px_rgba(102,21,44,0.20)]">
      <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-white/12" />
      <div className="pointer-events-none absolute -right-4 top-10 h-28 w-28 rounded-full bg-[#ff6a8c]/35" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-cyan-200/85" />

      <div className="relative flex h-14 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center">
          <Link
            href={homeHref}
            prefetch={false}
            className="flex min-w-0 items-center gap-2.5"
            aria-label="Topuna"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white shadow-[0_10px_22px_rgba(81,7,31,0.18)] ring-1 ring-white/50">
              <img src="/brand/icon.svg" alt="" width={40} height={40} className="h-10 w-10" />
            </span>
            <span className="min-w-0">
              <span className="block text-[22px] font-black leading-5 tracking-tight">
                <span className="brand-wordmark">Topuna</span>
              </span>
              <span className="mt-1 block text-[10px] font-black uppercase tracking-wide text-white/90">
                Top up, lanjut lagi
              </span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#"
            target="_blank"
            rel="noreferrer"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/25 bg-white/12 text-white shadow-sm transition hover:bg-white/18"
            aria-label="Hubungi bantuan via WhatsApp"
          >
            <Headset className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
