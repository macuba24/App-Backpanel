import net from "node:net";

let cached: { at: number; ok: boolean } | null = null;

function target(): { host: string; port: number } {
  const fallback = { host: "127.0.0.1", port: 5432 };
  const raw = process.env.DATABASE_URL;
  if (!raw) return fallback;
  try {
    const url = new URL(raw);
    const port = Number(url.port);
    return {
      host: url.hostname || fallback.host,
      port: Number.isFinite(port) && port > 0 ? port : fallback.port,
    };
  } catch {
    return fallback;
  }
}

/** True only when the database port accepts a connection within a second. */
export function databaseReachable(): Promise<boolean> {
  if (cached && Date.now() - cached.at < 10_000) return Promise.resolve(cached.ok);
  const { host, port } = target();
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const finish = (ok: boolean) => {
      socket.destroy();
      cached = { at: Date.now(), ok };
      resolve(ok);
    };
    socket.setTimeout(800);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}
