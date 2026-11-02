"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ActionResult } from "@/lib/action-result";
import { requireSessionTenant } from "@/lib/current-user";

const ALLOWED = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
} as const;

const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadPhoto(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const scope = await requireSessionTenant();
  if (!scope.ok) return scope;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Bitte ein Foto auswählen." };
  }

  const extension = ALLOWED[file.type as keyof typeof ALLOWED];
  if (!extension) {
    return { ok: false, error: "Erlaubt sind JPG, PNG, WEBP und GIF." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Ein Foto darf höchstens 5 MB groß sein." };
  }

  const filename = `${randomUUID()}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads", scope.tenantId);

  try {
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    console.error("uploadPhoto failed", error);
    return { ok: false, error: "Das Foto konnte nicht gespeichert werden." };
  }

  return { ok: true, url: `/uploads/${scope.tenantId}/${filename}` };
}
