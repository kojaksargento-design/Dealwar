import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const RESEND_API = "https://api.resend.com/emails";

/**
 * Transactional email via Resend REST (no SDK). Honest behavior: when
 * RESEND_API_KEY or OWNER_EMAIL is not configured, this no-ops — the in-app
 * bell notification is always the source of truth; email is a convenience.
 */
export const sendLeadNotification = internalAction({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    const ownerEmail = process.env.OWNER_EMAIL;
    if (!apiKey) return { sent: false, reason: "RESEND_API_KEY not configured" };
    if (!ownerEmail) return { sent: false, reason: "OWNER_EMAIL not configured" };

    const subject = `🔔 Novo pedido de patrocínio — ${args.name}`;
    const text = [
      `Novo pedido de patrocínio no DEALWAR:`,
      ``,
      `Empresa: ${args.name}`,
      `Email: ${args.email}`,
      `Mensagem: ${args.message}`,
      ``,
      `---`,
      `Responde diretamente para: ${args.email}`,
      `Painel: /owner no site DEALWAR`,
    ].join("\n");

    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DEALWAR <onboarding@resend.dev>",
        to: [ownerEmail],
        reply_to: args.email,
        subject,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { sent: false, reason: `Resend error ${res.status}: ${body.slice(0, 200)}` };
    }
    return { sent: true };
  },
});
