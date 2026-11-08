import { getBrandsByKategori, getCategories } from "@/lib/api.products";
import type { UserCategoryItem } from "@/components/user/types";
import { ProviderBrandPicker } from "@/components/guest/ProviderBrandPicker";

export async function WalletProviderCatalog({ mode }: { mode: "guest" | "user" }) {
  const categories = (await getCategories()) as UserCategoryItem[];
  const wallets = categories.filter(category => category.aktif && ["e-wallet", "e-money"].includes(category.nama.trim().toLowerCase()));
  const prefix = mode === "user" ? "/user/kategori" : "/kategori";
  const groups = await Promise.all(wallets.map(async category => {
    const brands = await getBrandsByKategori(String(category.id));
    return brands.filter(brand => brand.aktif).map(brand => ({
      brand,
      href: `${prefix}/${category.id}/brand/${brand.id}?name=${encodeURIComponent(brand.nama)}`,
    }));
  }));
  const items = groups.flat().sort((a, b) => a.brand.nama.localeCompare(b.brand.nama));
  return items.length ? <ProviderBrandPicker items={items} columns={2} /> : (
    <p className="py-10 text-center text-sm text-slate-500">Provider e-wallet belum tersedia.</p>
  );
}
