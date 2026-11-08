import { redirect } from "next/navigation";

type Props = {
  searchParams?: Promise<{
    member_id?: string;
    tab?: string;
  }>;
};

export default async function LegacyAdminMembersHistoryPage({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params?.member_id) qs.set("member_id", params.member_id);
  if (params?.tab) qs.set("tab", params.tab);

  const suffix = qs.toString();
  redirect(`/dashboard/admin/master/members/history${suffix ? `?${suffix}` : ""}`);
}
