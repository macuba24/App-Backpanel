import type { GeofenceConfig } from "@/modules/schema";

export function geofenceSetupError(fence: GeofenceConfig): string | null {
  if (!fence.enabled) return null;
  if (!fence.title) return "Titel ist erforderlich.";
  if (!fence.message) return "Nachricht im Umkreis ist erforderlich.";
  return null;
}
