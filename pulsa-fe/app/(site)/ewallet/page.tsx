import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth";
import { GuestBottomNav } from "@/components/guest/GuestBottomNav";
import { WalletProviderCatalog } from "@/components/shared/WalletProviderCatalog";
import { buildPageMetadata } from "@/lib/site-search";

export const metadata: Metadata = buildPageMetadata({
  title: "Top Up E-Wallet | Topuna",
  description: "Pilihan e-wallet dari katalog H2HR Pulsa24Jam.",
  path: "/ewallet",
});

export default async function GuestEwalletPage() {
  const session = (await getServerSession(authOptions)) as { backendToken?: string } | null;
  return <main className="min-h-screen bg-sky-50 px-4 pb-24 pt-4">
    <WalletProviderCatalog mode="guest" />
    <GuestBottomNav isLoggedIn={Boolean(session?.backendToken)} />
  </main>;
}
