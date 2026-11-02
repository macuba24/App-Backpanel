import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { SavedAppLink } from "@/lib/app-catalog";

const filePath = path.join(process.cwd(), "data", "app-connections.json");

type Store = Record<string, SavedAppLink>;

function storePaths(): string[] {
  const paths = [path.join(process.cwd(), "data", "app-connections.json")];
  let dir = process.cwd();
  for (let step = 0; step < 4; step += 1) {
    paths.push(path.join(dir, "data", "app-connections.json"));
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return [...new Set(paths)];
}

function readStore(): Store {
  for (const filePath of storePaths()) {
    try {
      const parsed: unknown = JSON.parse(readFileSync(filePath, "utf8"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
      return parsed as Store;
    } catch {
      // Try the next location.
    }
  }
  return {};
}

function asLink(value: unknown): SavedAppLink | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<SavedAppLink>;
  const slug = typeof row.slug === "string" ? row.slug.trim() : "";
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const url = typeof row.url === "string" ? row.url.trim() : "";
  if (!slug || !name || !url) return null;
  return { slug, name, url };
}

/** Connection saved on this machine. Used when the database is down or has no link yet. */
export function readLocalConnection(tenantId: string): SavedAppLink | null {
  const store = readStore();
  const direct = tenantId ? asLink(store[tenantId]) : null;
  if (direct) return direct;
  const links = Object.values(store).map((value) => asLink(value)).filter((item) => item !== null);
  return links.length === 1 ? links[0] : null;
}

export function writeLocalConnection(tenantId: string, app: SavedAppLink): void {
  const store = readStore();
  store[tenantId] = { slug: app.slug, name: app.name, url: app.url };
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}
