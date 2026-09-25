import Link from "next/link";
import { getAppServerSession } from "@/lib/server-auth";
import { getCategories } from "@/lib/api.products";
import type { UserCategoryItem, UserSession } from "@/components/user/types";
import { UserCategoryGrid } from "@/components/user/UserCategoryGrid";
import { UserFavoriteTransactions, UserMonthlyBills, UserRecentActivity } from "@/components/user/UserMainSections";
import { UserBottomNav } from "@/components/user/UserBottomNav";
import { UserAuthClientSync } from "@/components/user/UserAuthClientSync";
import { Bolt, Grid3X3, Wifi } from "lucide-react";

type SessionShape = {
  user?: UserSession;
  backendToken?: string;
};

function UserPromoBanner() {
  return (
    <Link href="/user/paket-data" className="relative block min-h-[150px] overflow-hidden rounded-[22px] bg-[#c8133f] px-5 py-5 text-white shadow-[0_14px_36px_rgba(102,21,44,0.14)]" prefetch={false}>
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
  );
}

export default async function UserAppHomePage() {
  const session = (await getAppServerSession()) as SessionShape | null;
  const categories = (await getCategories()) as UserCategoryItem[];
  const role = String(session?.user?.role || "").trim().toLowerCase();
  const isAgent = role === "agent";

  return (
    <main className="bg-[#fff7fa]">
      {session?.backendToken ? <UserAuthClientSync backendToken={session.backendToken} /> : null}
      <div className="space-y-5 px-5 pt-5">
        <UserCategoryGrid items={categories} />
        <UserPromoBanner />
        <UserRecentActivity href="/user/kategori" />
        <UserFavoriteTransactions href="/user/kategori" />
        <UserMonthlyBills
          href="/user/listrik/tagihan"
          variant={isAgent ? "agent" : "user"}
          agentBills={[]}
        />
      </div>

      <UserBottomNav />
    </main>
  );
}
