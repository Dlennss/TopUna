"use client";

import { usePathname } from "next/navigation";
import { AppTopHeader } from "@/components/shared/AppTopHeader";

type UserRouteHeaderProps = {
  isLoggedIn: boolean;
  role?: string | null;
};

export function UserRouteHeader({ isLoggedIn, role }: UserRouteHeaderProps) {
  const pathname = usePathname() || "";

  if (pathname === "/user") return null;

  return (
    <AppTopHeader
      isLoggedIn={isLoggedIn}
      role={role}
    />
  );
}
