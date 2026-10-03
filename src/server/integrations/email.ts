import "server-only";

export type EmailMessage = { to: string; subject: string; text: string; html?: string };
export type SendResult =
  | { status: "SENT"; providerMessageId: string }
  | { status: "NOT_CONFIGURED" }
  | { status: "FAILED"; error: string };

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/**
 * Sends via Resend's HTTP API. Returns NOT_CONFIGURED (never a fake SENT) when no
 * credentials are present. "SENT" means the provider accepted the message; delivery is
 * only confirmed later by the provider webhook.
 */
export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  if (!isEmailConfigured()) return { status: "NOT_CONFIGURED" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: msg.to, subject: msg.subject, text: msg.text, html: msg.html }),
    });
    if (!res.ok) return { status: "FAILED", error: `Provider responded ${res.status}` };
    const data = (await res.json()) as { id?: string };
    return { status: "SENT", providerMessageId: data.id ?? "" };
  } catch (err) {
    return { status: "FAILED", error: err instanceof Error ? err.message : "Unknown error" };
  }
}
