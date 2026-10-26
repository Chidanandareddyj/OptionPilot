"use client";

import { OrganizationView } from "@neondatabase/auth-ui";

export default function OrganizationViewClient({ path }: { path: string }) {
  return <OrganizationView path={path} classNames={{ base: "p-0 md:p-0" }} />;
}
