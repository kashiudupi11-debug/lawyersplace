import "server-only";
import { headers } from "next/headers";

export async function getRequestInfo() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ipAddress: forwarded || h.get("x-real-ip") || "unknown",
    userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
  };
}
