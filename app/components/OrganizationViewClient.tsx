"use client";

import { OrganizationView } from "@neondatabase/auth-ui";

export default function OrganizationViewClient({ path }: { path: string }) {
  return <OrganizationView path={path} />;
}
