/**
 * @file apps/site/src/app/api/contact/route.ts
 * @layer site/app
 *
 * @description
 * Route API publique d’envoi de formulaire de contact via Resend.
 *
 * @remarks
 * - Route server-only.
 * - Valide défensivement le payload reçu.
 * - Envoie un email vers l’adresse configurée dans `CONTACT_TO_EMAIL`.
 * - Utilise `CONTACT_FROM_EMAIL` comme expéditeur.
 * - Prévu pour être branché ensuite sur `SiteContactForm`.
 */

import { NextResponse } from "next/server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const contactFromEmail = process.env.CONTACT_FROM_EMAIL;

const resend = resendApiKey ? new Resend(resendApiKey) : null;

type ContactPayload = Readonly<{
  toEmail?: unknown;
  values?: Record<string, unknown>;
}>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeFormValues(
  input: Record<string, unknown>,
): Record<string, string> {
  const output: Record<string, string> = {};

  for (const [key, value] of Object.entries(input)) {
    if (typeof value !== "string") {
      continue;
    }

    output[key] = value.trim();
  }

  return output;
}

function buildEmailSubject(values: Record<string, string>): string {
  const email = values.email;
  const name = values.name;

  if (isNonEmptyString(name) && isNonEmptyString(email)) {
    return `Nouveau message de ${name} (${email})`;
  }

  if (isNonEmptyString(email)) {
    return `Nouveau message de ${email}`;
  }

  return "Nouveau message depuis le formulaire de contact";
}

function buildEmailHtml(values: Record<string, string>): string {
  const rows = Object.entries(values)
    .filter(([, value]) => value.length > 0)
    .map(([key, value]) => {
      return `
        <tr>
          <td style="padding:8px 12px;font-weight:600;vertical-align:top;border:1px solid #e5e7eb;">
            ${escapeHtml(key)}
          </td>
          <td style="padding:8px 12px;vertical-align:top;border:1px solid #e5e7eb;white-space:pre-wrap;">
            ${escapeHtml(value)}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.5;">
      <h1 style="font-size:18px;margin-bottom:16px;">
        Nouveau message depuis le formulaire de contact
      </h1>

      <table style="border-collapse:collapse;width:100%;max-width:720px;">
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function buildEmailText(values: Record<string, string>): string {
  const lines = Object.entries(values)
    .filter(([, value]) => value.length > 0)
    .map(([key, value]) => `${key}:\n${value}`);

  return ["Nouveau message depuis le formulaire de contact", "", ...lines].join(
    "\n",
  );
}

export async function POST(request: Request) {
  try {
    if (!resend) {
      return NextResponse.json(
        { error: "Missing RESEND_API_KEY." },
        { status: 500 },
      );
    }

    if (!isNonEmptyString(contactFromEmail)) {
      return NextResponse.json(
        { error: "Missing CONTACT_FROM_EMAIL." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as ContactPayload;

    const toEmail = isNonEmptyString(body?.toEmail)
      ? body.toEmail.trim()
      : null;

    if (!isNonEmptyString(toEmail)) {
      return NextResponse.json(
        { error: "Missing destination email." },
        { status: 400 },
      );
    }

    const rawValues = body?.values;

    if (
      !rawValues ||
      typeof rawValues !== "object" ||
      Array.isArray(rawValues)
    ) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const values = normalizeFormValues(rawValues);

    const hasAtLeastOneValue = Object.values(values).some(
      (value) => value.length > 0,
    );

    if (!hasAtLeastOneValue) {
      return NextResponse.json(
        { error: "Empty form payload." },
        { status: 400 },
      );
    }

    const subject = buildEmailSubject(values);
    const html = buildEmailHtml(values);
    const text = buildEmailText(values);

    await resend.emails.send({
      from: contactFromEmail,
      to: toEmail,
      subject,
      html,
      text,
      replyTo: isNonEmptyString(values.email) ? values.email : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact API error:", error);

    return NextResponse.json(
      { error: "Failed to send contact email." },
      { status: 500 },
    );
  }
}
