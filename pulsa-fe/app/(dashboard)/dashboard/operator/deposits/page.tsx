import DepositRequestsPage from "@/components/dashboard/DepositRequestsPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function OperatorDepositsPage() {
  return <DepositRequestsPage />;
}
