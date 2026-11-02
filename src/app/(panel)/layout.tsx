import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/dashboard/app-shell";
import { connectedIdentity } from "@/lib/app-face";
import { getPanelContext } from "@/lib/panel-context";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="bg-zinc-50 p-8 text-sm text-zinc-500">Wird geladen…</p>}>
      <PanelFrame>{children}</PanelFrame>
    </Suspense>
  );
}

async function PanelFrame({ children }: { children: React.ReactNode }) {
  const context = await getPanelContext();

  if (!context.ok) {
    if (context.unauthenticated) redirect("/login");
    return (
      <AppShell
        email={context.email}
        displayName={context.email}
        tenantName={context.connection?.name ?? ""}
        appName={context.connection?.name ?? ""}
        slug={context.connection?.slug ?? ""}
        websiteUrl={context.connection?.url ?? ""}
        connection={context.connection}
      >
        {children}
      </AppShell>
    );
  }

  const shown = connectedIdentity(context.current);

  return (
    <AppShell
      email={context.email}
      displayName={context.displayName}
      tenantName={shown.name}
      appName={shown.name}
      slug={shown.slug}
      websiteUrl={shown.websiteUrl}
      connection={context.current.connection}
    >
      {children}
    </AppShell>
  );
}
