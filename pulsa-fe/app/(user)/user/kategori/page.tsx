import { getAppServerSession } from "@/lib/server-auth";
import type { UserCategoryItem, UserSession } from "@/components/user/types";
import { getCategories } from "@/lib/api.products";
import { UserBottomNav } from "@/components/user/UserBottomNav";
import { UserAuthClientSync } from "@/components/user/UserAuthClientSync";
import { ServiceDirectory } from "@/components/shared/ServiceDirectory";
import { UserUniversalServicePageContent } from "@/components/user/UserUniversalServicePageContent";

type SessionShape = {
  user?: UserSession;
  backendToken?: string;
};

type PageProps = {
  searchParams?: Promise<{ layanan?: string }>;
};

export default async function UserAllCategoryPage({ searchParams }: PageProps) {
  const session = (await getAppServerSession()) as SessionShape | null;
  const backendToken = session?.backendToken;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const serviceSlug = String(resolvedSearchParams?.layanan || "").trim().toLowerCase();

  if (serviceSlug) {
    return (
      <>
        {backendToken ? <UserAuthClientSync backendToken={backendToken} /> : null}
        <UserUniversalServicePageContent serviceSlug={serviceSlug} />
        <UserBottomNav />
      </>
    );
  }

  const categories = (await getCategories()) as UserCategoryItem[];
  return (
    <main className="bg-sky-50">
      {backendToken ? <UserAuthClientSync backendToken={backendToken} /> : null}

      <div className="space-y-4 px-4 pt-4">
        <ServiceDirectory mode="user" categories={categories} />
      </div>

      <UserBottomNav />
    </main>
  );
}
