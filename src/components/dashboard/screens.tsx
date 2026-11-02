import { redirect } from "next/navigation";

import { ConnectTool } from "@/components/dashboard/connect-tool";
import { DesignForm } from "@/components/dashboard/design-form";
import { FactoryForm } from "@/components/dashboard/factory-form";
import { ModuleManager } from "@/components/dashboard/module-manager";
import { Overview, LinkedAppSummary } from "@/components/dashboard/overview";
import { SchmahlMirror } from "@/components/dashboard/schmahl-mirror";
import { connectedIdentity, faceFor } from "@/lib/app-face";
import { getPanelContext, type PanelTenant } from "@/lib/panel-context";
import type { SavedAppLink } from "@/lib/app-catalog";
import { defaultActiveModules } from "@/modules/defaults";
import { parseFactory } from "@/modules/factory";

function offlineTenant(connection: SavedAppLink | null): PanelTenant {
  if (connection) return faceFor(connection);
  const name = "App";
  return {
    id: "local",
    name,
    slug: "",
    appName: name,
    apiKey: "",
    branding: {
      primaryColor: "#71abd9",
      logoUrl: "",
      welcomeMessage: "",
    },
    modules: defaultActiveModules,
    factory: parseFactory({
      company: { enabled: true, name },
      homepage: { enabled: false, label: "Homepage", url: "" },
    }),
    connection,
  };
}

export async function OverviewScreen() {
  const context = await getPanelContext();
  if (!context.ok) {
    if (context.unauthenticated) redirect("/login");
    return <LinkedAppSummary connection={context.connection} />;
  }
  return <Overview tenant={context.current} preview={connectedIdentity(context.current).preview} />;
}

export async function ModulesScreen() {
  const context = await getPanelContext();
  if (!context.ok) {
    if (context.unauthenticated) redirect("/login");
    const tenant = offlineTenant(context.connection);
    return <ModuleManager key={tenant.id} tenantId={tenant.id} initialConfig={tenant.modules} />;
  }
  return <ModuleManager key={context.current.id} tenantId={context.current.id} initialConfig={context.current.modules} />;
}

export async function FactoryScreen() {
  const context = await getPanelContext();
  if (!context.ok) {
    if (context.unauthenticated) redirect("/login");
    const tenant = offlineTenant(context.connection);
    return <FactoryForm key={tenant.id} tenantId={tenant.id} initial={tenant.factory} />;
  }
  const shown = connectedIdentity(context.current);
  return <FactoryForm key={shown.preview.id} tenantId={context.current.id} initial={shown.preview.factory} />;
}

export async function PreviewScreen() {
  const context = await getPanelContext();
  if (!context.ok) {
    if (context.unauthenticated) redirect("/login");
    return <SchmahlMirror tenant={offlineTenant(context.connection)} />;
  }
  const shown = connectedIdentity(context.current);
  return <SchmahlMirror tenant={shown.preview} canReorder={shown.preview.id === context.current.id} />;
}

export async function ConnectScreen() {
  const context = await getPanelContext();
  if (!context.ok) {
    if (context.unauthenticated) redirect("/login");
    return (
      <ConnectTool connection={context.connection} />
    );
  }
  return <ConnectTool connection={context.current.connection} />;
}

export async function DesignScreen() {
  const context = await getPanelContext();
  if (!context.ok) {
    if (context.unauthenticated) redirect("/login");
    const tenant = offlineTenant(context.connection);
    return (
      <DesignForm
        key={tenant.id}
        tenantId={tenant.id}
        tenantName={tenant.name}
        primaryColor={tenant.branding.primaryColor}
        logoUrl={tenant.branding.logoUrl}
        welcomeMessage={tenant.branding.welcomeMessage}
      />
    );
  }
  return (
    <DesignForm
      key={context.current.id}
      tenantId={context.current.id}
      tenantName={connectedIdentity(context.current).name}
      primaryColor={context.current.branding.primaryColor}
      logoUrl={context.current.branding.logoUrl}
      welcomeMessage={context.current.branding.welcomeMessage}
    />
  );
}
