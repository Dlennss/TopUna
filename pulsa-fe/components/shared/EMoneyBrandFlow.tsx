"use client";

import * as React from "react";
import Image from "next/image";
import { Wallet } from "lucide-react";
import { UserProductGrid } from "@/components/user/UserProductGrid";
import type { UserProductItem } from "@/components/user/types";
import { getBrandLogo } from "@/lib/brand-logos";
import { buildEwalletGroups } from "@/lib/ewallet-catalog";

type EMoneyBrandFlowProps = {
  items: UserProductItem[];
  isLoggedIn: boolean;
  authToken?: string;
  mode: "guest" | "user";
  buyerRole?: string;
  initialDest?: string;
};

export function EMoneyBrandFlow({ items, isLoggedIn, authToken, buyerRole, initialDest = "" }: EMoneyBrandFlowProps) {
  const groups = React.useMemo(() => buildEwalletGroups(items), [items]);
  const brandId = items[0]?.brand_id;
  const [selection, setSelection] = React.useState<{ brandId: number | undefined; key: string } | null>(null);
  const selected = (selection?.brandId === brandId ? groups.find(group => group.key === selection?.key) : null) ?? groups[0];
  const brandName = items[0]?.brand_nama?.trim() || "E-Wallet";
  const brandLogo = getBrandLogo(brandName);
  const id = React.useId();

  if (!selected) {
    return <p className="py-10 text-center text-sm text-slate-500">Belum ada produk aktif untuk provider ini.</p>;
  }

  function selectTab(index: number) {
    setSelection({ brandId, key: groups[index].key });
    document.getElementById(`${id}-tab-${index}`)?.focus();
  }

  return (
    <div className="mt-2 space-y-4 pb-24">
      <header className="flex items-center gap-3 border-b border-slate-200 py-4">
        {brandLogo ? (
          <Image src={brandLogo.src} alt={brandLogo.alt} width={48} height={48} className="h-12 w-12 shrink-0 object-contain" />
        ) : <Wallet className="h-8 w-8 shrink-0 text-[#d30940]" />}
        <div className="min-w-0">
          <p className="text-xs text-slate-500">E-Wallet</p>
          <h1 className="break-words text-xl font-bold text-slate-950">{brandName}</h1>
        </div>
      </header>

      <div role="tablist" aria-label="Layanan H2HR" className="flex gap-2 overflow-x-auto pb-1">
        {groups.map((group, index) => {
          const active = group.key === selected.key;
          return (
            <button key={group.key} id={`${id}-tab-${index}`} type="button" role="tab"
              aria-selected={active} aria-controls={`${id}-products`} tabIndex={active ? 0 : -1}
              onClick={() => setSelection({ brandId, key: group.key })}
              onKeyDown={event => {
                const next = event.key === "ArrowRight" ? (index + 1) % groups.length
                  : event.key === "ArrowLeft" ? (index + groups.length - 1) % groups.length
                  : event.key === "Home" ? 0 : event.key === "End" ? groups.length - 1 : null;
                if (next !== null) { event.preventDefault(); selectTab(next); }
              }}
              className={`h-10 shrink-0 rounded-md border px-4 text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d30940] ${active ? "border-[#d30940] bg-[#d30940] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-rose-300"}`}
            >{group.key}</button>
          );
        })}
      </div>

      <div role="tabpanel" id={`${id}-products`} aria-labelledby={`${id}-tab-${groups.indexOf(selected)}`} tabIndex={0}>
        <UserProductGrid key={`${brandId}-${selected.key}`} items={selected.items} isLoggedIn={isLoggedIn}
          authToken={authToken} buyerRole={buyerRole} initialDest={initialDest} buyLabel="Top Up" enableGuestHint={false} />
      </div>
    </div>
  );
}
