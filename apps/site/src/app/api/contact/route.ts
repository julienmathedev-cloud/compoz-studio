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
  const subject = values.subject || values.sujet;
  const email = values.email;
  const name = values.name || values.nom;

  if (isNonEmptyString(subject)) {
    return `Nouveau message — ${subject}`;
  }

  if (isNonEmptyString(name) && isNonEmptyString(email)) {
    return `Nouveau message de ${name} (${email})`;
  }

  if (isNonEmptyString(email)) {
    return `Nouveau message de ${email}`;
  }

  return "Nouveau message depuis le formulaire de contact";
}

function buildEmailHtml(values: Record<string, string>): string {
  const name = values.name || values.nom;
  const email = values.email;
  const subject = values.subject || values.sujet;
  const message = values.message;

  const secondaryRows = Object.entries(values)
    .filter(([key, value]) => {
      if (!value.trim()) return false;
      return !["name", "nom", "email", "subject", "sujet", "message"].includes(
        key,
      );
    })
    .map(
      ([key, value]) => `
        <p style="margin:0 0 12px;">
          <strong>${escapeHtml(key)}</strong><br />
          ${escapeHtml(value)}
        </p>
      `,
    )
    .join("");

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.6;background:#f9fafb;padding:24px;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">
          Nouveau message depuis le formulaire de contact
        </p>

        <h1 style="font-size:22px;line-height:1.3;margin:0 0 24px;color:#111827;">
          ${escapeHtml(subject || "Demande de contact")}
        </h1>

        ${
          name || email
            ? `
              <div style="margin-bottom:24px;padding:16px;background:#f9fafb;border-radius:10px;">
                ${
                  name
                    ? `<p style="margin:0 0 8px;"><strong>Nom :</strong> ${escapeHtml(name)}</p>`
                    : ""
                }
                ${
                  email
                    ? `<p style="margin:0;"><strong>Email :</strong> <a href="mailto:${escapeHtml(email)}" style="color:#2563eb;">${escapeHtml(email)}</a></p>`
                    : ""
                }
              </div>
            `
            : ""
        }

        ${
          message
            ? `
              <div style="margin-bottom:24px;">
                <h2 style="font-size:16px;margin:0 0 8px;color:#111827;">Message</h2>
                <p style="margin:0;white-space:pre-wrap;">${escapeHtml(message)}</p>
              </div>
            `
            : ""
        }

        ${
          secondaryRows
            ? `
              <div style="border-top:1px solid #e5e7eb;padding-top:16px;color:#374151;">
                ${secondaryRows}
              </div>
            `
            : ""
        }

        <p style="margin:24px 0 0;color:#6b7280;font-size:13px;">
          Vous pouvez répondre directement à cet email pour contacter l’expéditeur.
        </p>
      </div>
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
    console.error("Contact API error:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Failed to send contact email." },
      { status: 500 },
    );
  }
}
