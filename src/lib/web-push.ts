import webpush from "web-push";

export type PushDevice = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export function vapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY?.trim() ?? "";
}

export function pushKeysReady(): boolean {
  return Boolean(vapidPublicKey() && process.env.VAPID_PRIVATE_KEY?.trim());
}

function configure() {
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:push@backpanel.local";
  webpush.setVapidDetails(subject, vapidPublicKey(), process.env.VAPID_PRIVATE_KEY?.trim() ?? "");
}

export type PushDelivery = {
  sent: number;
  removed: string[];
  failed: number;
  reason: string | null;
};

function statusOf(error: unknown): number {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) return 0;
  const status = Number(error.statusCode);
  return Number.isFinite(status) ? status : 0;
}

function failureReason(status: number): string {
  if (status === 401 || status === 403) return "Der Push-Dienst hat die Schlüssel abgelehnt.";
  if (status >= 400) return `Der Push-Dienst antwortete mit Status ${status}.`;
  return "Der Push-Dienst ist nicht erreichbar.";
}

/** Sends one visible notification per stored device. Expired devices are returned so the caller can delete them. */
export async function deliverPush(
  devices: PushDevice[],
  payload: { title: string; message: string; url: string },
): Promise<PushDelivery> {
  if (!pushKeysReady()) {
    return { sent: 0, removed: [], failed: 0, reason: "Die Push-Schlüssel fehlen auf dem Server." };
  }
  if (devices.length === 0) return { sent: 0, removed: [], failed: 0, reason: null };
  configure();
  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  let reason: string | null = null;
  const removed: string[] = [];
  for (const device of devices) {
    try {
      await webpush.sendNotification(
        { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
        body,
        { TTL: 12 * 60 * 60, urgency: "high" },
      );
      sent += 1;
    } catch (error) {
      const status = statusOf(error);
      if (status === 404 || status === 410) {
        removed.push(device.id);
        continue;
      }
      failed += 1;
      reason ??= failureReason(status);
    }
  }
  return { sent, removed, failed, reason };
}
