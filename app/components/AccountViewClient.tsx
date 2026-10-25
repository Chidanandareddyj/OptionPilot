"use client";

import { AccountView } from "@neondatabase/auth-ui";

export default function AccountViewClient({ path }: { path: string }) {
  return <AccountView path={path} hideNav classNames={{ base: "p-0 md:p-0", cards: "gap-4" }} />;
}
