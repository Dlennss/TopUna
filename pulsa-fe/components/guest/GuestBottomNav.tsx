import { RetailBottomNav } from "@/components/site/RetailBottomNav";

export function GuestBottomNav({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return <RetailBottomNav isLoggedIn={isLoggedIn} />;
}
