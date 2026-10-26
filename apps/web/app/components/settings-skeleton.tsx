import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsHeader } from "./AuthAppShell";
import { PillNav } from "./pill-nav";

function FieldSkeleton() {
  return (
    <Card className="gap-0 p-0">
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full max-w-96" />
        <Skeleton className="h-10 w-full max-w-[480px]" />
      </div>
      <div className="flex items-center rounded-b-xl bg-muted px-6 py-3">
        <Skeleton className="h-4 w-72 bg-accent" />
        <Skeleton className="ml-auto h-8 w-16 bg-accent" />
      </div>
    </Card>
  );
}

/** Mirrors the settings layout while the session and account data load. */
export function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <PillNav>
        <Skeleton className="mx-1 h-8 w-40 rounded-full max-sm:hidden" />
        <Skeleton className="mr-1 size-8 rounded-md" />
      </PillNav>
      <div className="flex flex-col gap-4 px-4 pt-20 pb-8 lg:flex-row lg:items-start">
        <Skeleton className="h-52 rounded-xl max-lg:hidden lg:w-64 lg:shrink-0" />
        <main role="status" aria-label="Loading your account details" className="flex min-w-0 flex-1 flex-col gap-4">
          <SettingsHeader />
          <div className="flex max-w-[760px] flex-col gap-4">
            <Card className="flex-row items-center gap-4 p-6">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-80 max-w-full" />
              </div>
              <Skeleton className="ml-auto size-16 rounded-xl" />
            </Card>
            <FieldSkeleton />
            <FieldSkeleton />
            <p className="px-2 text-sm text-faint">Loading your account details.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
