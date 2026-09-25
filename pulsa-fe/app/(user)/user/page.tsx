import { getUserProfile } from "@/lib/api.auth";
import { getAppServerSession } from "@/lib/server-auth";
import { TopunaReferenceHome } from "@/components/site/TopunaReferenceHome";
import { UserAuthClientSync } from "@/components/user/UserAuthClientSync";
import type { UserSession } from "@/components/user/types";

type SessionShape = {
  user?: UserSession;
  backendToken?: string;
};

export default async function UserAppHomePage() {
  const session = (await getAppServerSession()) as SessionShape | null;
  const profile = session?.backendToken ? await getUserProfile(session.backendToken).catch(() => null) : null;

  return (
    <main className="bg-[#fff7fa]">
      {session?.backendToken ? <UserAuthClientSync backendToken={session.backendToken} /> : null}
      <TopunaReferenceHome
        viewer={{
          isLoggedIn: Boolean(session?.backendToken),
          name: profile?.nama || session?.user?.name || session?.user?.email || null,
          saldo: profile?.saldo ?? null,
          profilePhotoUrl: profile?.profile_photo_url || session?.user?.image || null,
        }}
      />
    </main>
  );
}
