import type { Metadata } from "next";
import { getCategories } from "@/lib/api.products";
import type { UserCategoryItem } from "@/components/user/types";
import { GuestCategoryPageContent } from "@/components/site/GuestCategoryPageContent";
import { buildBreadcrumbJsonLd, buildCollectionJsonLd, buildPageMetadata } from "@/lib/site-search";

export const metadata: Metadata = buildPageMetadata({
  title: "Top Up Game Online | Topuna",
  description: "Top up Mobile Legends, Free Fire, PUBG Mobile, Roblox, dan game online lain di Topuna dengan pilihan nominal yang jelas.",
  path: "/game",
  keywords: ["top up game", "voucher game online", "diamond mobile legends", "top up free fire", "pulsakilat"],
});

export default async function GamePage() {
  const categories = (await getCategories()) as UserCategoryItem[];
  const category = categories.find(item => item.aktif && item.nama.trim().toLowerCase() === "game");
  const collectionJsonLd = buildCollectionJsonLd({
    title: "Top Up Game Online | Topuna",
    description: "Top up Mobile Legends, Free Fire, PUBG Mobile, Roblox, dan game online lain di Topuna dengan pilihan nominal yang jelas.",
    path: "/game",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Beranda", path: "/" },
    { name: "Game", path: "/game" },
  ]);

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {category ? <GuestCategoryPageContent kategoriId={String(category.id)} title="Game" /> : <p className="p-6 text-sm text-slate-500">Kategori game belum tersedia.</p>}
    </main>
  );
}
