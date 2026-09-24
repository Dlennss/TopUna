import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "Topuna",
  description: "Topup & PPOB cepat",
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#fcf5f7] text-neutral-900 md:grid md:place-items-start md:py-4">
      <div className="relative mx-auto w-full max-w-md md:w-97.5 md:max-w-none md:overflow-hidden md:border md:border-[#651e34]/10 md:bg-[#fcf5f7] md:shadow-[0_24px_80px_rgba(6,78,59,0.18)]">
        <SiteShell>{children}</SiteShell>
      </div>
    </div>
  );
}
