"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import type { UserCategoryItem } from "@/components/user/types";

const icons: Record<string, string> = {
  pulsa: "pulsa", "paket data": "paket-data", "voucher data": "paket-data",
  "e-wallet": "ewallet", "e-money": "uang-elektronik", game: "voucher-game",
  pln: "token-pln", bpjs: "bpjs", asuransi: "asuransi",
  "tagihan air": "pdam", "tagihan gas": "gas-pgn", "transfer bank": "transfer-bank",
  "bank transfer": "transfer-bank", "tv & streaming": "tv-kabel",
  "internet & telco": "internet-wifi", multifinance: "cicilan-multifinance",
  "pajak daerah": "pbb", pascabayar: "hp-pascabayar", "telepon & sms": "pulsa",
};

export function ServiceDirectory({ mode = "guest", categories }: {
  mode?: "guest" | "user";
  categories: UserCategoryItem[];
}) {
  const [search, setSearch] = useState("");
  const items = categories.filter(item => item.aktif && item.nama.toLowerCase().includes(search.trim().toLowerCase()));
  const prefix = mode === "user" ? "/user/kategori" : "/kategori";
  return <section className="pb-24">
    <div className="mb-4 flex items-center gap-3">
      <h1 className="text-xl font-bold text-slate-950">Layanan</h1>
      <span className="text-sm text-slate-500">{categories.filter(item => item.aktif).length}</span>
    </div>
    <label className="mb-4 flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 focus-within:border-rose-400">
      <Search aria-hidden="true" size={18} className="shrink-0 text-slate-500" />
      <input type="search" aria-label="Cari layanan" placeholder="Cari layanan" value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
    </label>
    <div className="divide-y divide-slate-100 bg-white">
      {items.map(item => <Link key={item.id} href={`${prefix}/${item.id}?name=${encodeURIComponent(item.nama)}`} className="flex min-h-16 items-center gap-3 px-3 py-3 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-500">
        <Image src={`/service-icons/${icons[item.nama.trim().toLowerCase()] ?? "voucher-digital"}.png`} alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" />
        <span className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-900">{item.nama}</span>
        <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-slate-400" />
      </Link>)}
    </div>
    {!items.length && <p className="py-8 text-center text-sm text-slate-500">Layanan tidak ditemukan.</p>}
  </section>;
}
