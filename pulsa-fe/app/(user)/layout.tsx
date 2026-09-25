import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAppServerSession } from "@/lib/server-auth";
import type { UserSession } from "@/components/user/types";
import { AppTopHeader } from "@/components/shared/AppTopHeader";

export const metadata: Metadata = {
  title: "User Area - Topuna",
  description: "Aplikasi user untuk pembelian produk digital langsung.",
};

type SessionShape = {
  user?: UserSession;
  backendToken?: string;
};

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = (await getAppServerSession()) as SessionShape | null;
  const role = String(session?.user?.role || "").trim().toLowerCase();
  const isRetailRole = role === "user" || role === "agent" || role === "master" || role === "marketing";

  if (!session?.backendToken) {
    redirect("/login");
  }

  if (session?.backendToken && role && !isRetailRole) {
    if (role === "admin" || role === "staff") redirect("/dashboard/admin");
    if (role === "member" || role === "agent_member" || role === "master_member") redirect("/dashboard/member");
    if (role === "operator_trx") redirect("/dashboard/operator");
    if (role === "operator_wallet") redirect("/dashboard/wallet");
    redirect("/dashboard");
  }

  return (
    <div className="min-h-svh bg-[#fff7fa] text-neutral-900 md:grid md:place-items-start md:py-4">
      <div className="relative mx-auto w-full max-w-md md:w-97.5 md:max-w-none md:border md:border-rose-100 md:bg-[#fff7fa] md:shadow-[0_24px_80px_rgba(102,21,44,0.16)]">
        <AppTopHeader
          isLoggedIn={Boolean(session?.backendToken)}
          role={role}
        />
        <div className="brand-retail-main min-h-svh pb-24">
          {children}
        </div>
      </div>
    </div>
  );
}
