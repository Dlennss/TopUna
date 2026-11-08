import type { UserProductItem } from "@/components/user/types";

export function buildEwalletGroups(items: UserProductItem[]) {
  const groups = new Map<string, UserProductItem[]>();
  for (const item of items) {
    if (!item.aktif || /^CEK/i.test(item.sku) || /CEK (?:NAMA )?AKUN/i.test(item.nama)) continue;
    // Group names come from H2HR; price type must not merge PPOB with PULSA.
    const key = item.group_name?.trim().toUpperCase() || "LAINNYA";
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  const priority = ["PPOB", "PULSA"];
  const rank = (key: string) => priority.includes(key) ? priority.indexOf(key) : priority.length;
  return Array.from(groups, ([key, products]) => ({ key, items: products }))
    .sort((a, b) => rank(a.key) - rank(b.key) || a.key.localeCompare(b.key));
}
