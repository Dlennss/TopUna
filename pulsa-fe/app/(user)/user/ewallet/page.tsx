import { UserBottomNav } from "@/components/user/UserBottomNav";
import { WalletProviderCatalog } from "@/components/shared/WalletProviderCatalog";

export const dynamic = "force-dynamic";

export default function UserEwalletPage() {
  return <main className="min-h-screen bg-sky-50 px-4 pb-24 pt-4">
    <WalletProviderCatalog mode="user" />
    <UserBottomNav />
  </main>;
}
