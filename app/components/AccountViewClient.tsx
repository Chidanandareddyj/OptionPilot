"use client";

import { AccountView } from "@neondatabase/auth-ui";

export default function AccountViewClient({ path }: { path: string }) {
  return <AccountView path={path} />;
}
