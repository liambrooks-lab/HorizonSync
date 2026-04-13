"use server";

import { getEmailFromAddress, getEmailTransporter } from "@/shared/lib/email";
import { absoluteUrl } from "@/shared/lib/utils";

type SendLoginNotificationInput = {
  email: string;
  name?: string | null;
  provider?: string | null;
  timestampIso: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendLoginNotificationAction({
  email,
  name,
  provider,
  timestampIso,
}: SendLoginNotificationInput) {
  const transporter = getEmailTransporter();

  if (!transporter || !email) {
    return { delivered: false, skipped: true };
  }

  const displayName = escapeHtml(name?.trim() || "there");
  const providerLabel = escapeHtml(provider ? provider.toUpperCase() : "Credentials");
  const formattedTimestamp = new Date(timestampIso).toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const dashboardUrl = absoluteUrl("/global");

  const html = `
    <div style="margin:0;padding:32px 16px;background:#090a12;font-family:Segoe UI,Arial,sans-serif;color:#f8f9ff;">
      <div style="max-width:640px;margin:0 auto;border:1px solid rgba(168,85,247,0.18);border-radius:28px;overflow:hidden;background:linear-gradient(180deg,#12131c 0%,#0f1018 100%);box-shadow:0 32px 100px -48px rgba(0,0,0,0.85);">
        <div style="padding:32px;background:linear-gradient(135deg,rgba(168,85,247,0.22),rgba(17,18,28,0.16));border-bottom:1px solid rgba(168,85,247,0.15);">
          <div style="display:inline-block;padding:10px 14px;border-radius:999px;background:#a855f7;color:#ffffff;font-weight:700;letter-spacing:0.12em;font-size:12px;text-transform:uppercase;">HorizonSync</div>
          <h1 style="margin:20px 0 12px;font-size:30px;line-height:1.2;">Welcome back, ${displayName}</h1>
          <p style="margin:0;font-size:15px;line-height:1.8;color:#cfd4f8;">A successful sign-in was recorded on your HorizonSync workspace. This email is part welcome message, part visibility check for account security.</p>
        </div>
        <div style="padding:32px;">
          <div style="padding:20px;border-radius:22px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#9aa3d9;">Login summary</p>
            <p style="margin:0 0 10px;font-size:15px;line-height:1.8;color:#f8f9ff;"><strong style="color:#ffffff;">Provider:</strong> ${providerLabel}</p>
            <p style="margin:0 0 10px;font-size:15px;line-height:1.8;color:#f8f9ff;"><strong style="color:#ffffff;">Time:</strong> ${escapeHtml(formattedTimestamp)}</p>
            <p style="margin:0;font-size:15px;line-height:1.8;color:#f8f9ff;"><strong style="color:#ffffff;">Account:</strong> ${escapeHtml(email)}</p>
          </div>
          <p style="margin:24px 0 0;font-size:15px;line-height:1.8;color:#cfd4f8;">If this was you, no action is needed. If this looks unfamiliar, rotate your password and review connected providers immediately.</p>
          <div style="margin-top:28px;">
            <a href="${dashboardUrl}" style="display:inline-block;padding:14px 18px;border-radius:18px;background:#a855f7;color:#ffffff;text-decoration:none;font-weight:700;">Open HorizonSync</a>
          </div>
        </div>
      </div>
    </div>
  `;

  const text = [
    `Welcome back to HorizonSync, ${name?.trim() || "there"}.`,
    `A login was recorded for ${email}.`,
    `Provider: ${provider ?? "credentials"}`,
    `Time: ${formattedTimestamp}`,
    `Open your workspace: ${dashboardUrl}`,
  ].join("\n");

  await transporter.sendMail({
    from: getEmailFromAddress(),
    html,
    subject: "HorizonSync sign-in confirmation",
    text,
    to: email,
  });

  return { delivered: true, skipped: false };
}
