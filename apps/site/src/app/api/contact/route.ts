/**
 * @file apps/site/src/app/api/contact/route.ts
 * @layer site/app
 *
 * @description
 * Public contact form API route powered by Resend.
 *
 * @remarks
 * - Runs server-side and validates the received payload defensively.
 * - Sends email to the destination configured by the form cell.
 * - Uses `CONTACT_FROM_EMAIL` as the sender address.
 * - Supports dynamic fields configured from the builder.
 * - Uses `subject` / `sujet` as optional subject conventions.
 * - Uses `email` as the optional reply-to convention.
 */

import { NextResponse } from "next/server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const contactFromEmail = process.env.CONTACT_FROM_EMAIL;

const resend = resendApiKey ? new Resend(resendApiKey) : null;

const SUBJECT_FIELD_KEYS = new Set(["subject", "sujet"]);

type ContactPayload = Readonly<{
  toEmail?: unknown;
  values?: Record<string, unknown>;
  fields?: unknown;
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

function normalizeFieldLabels(input: unknown): Record<string, string> {
  const output: Record<string, string> = {};

  if (!Array.isArray(input)) {
    return output;
  }

  for (const field of input) {
    if (!field || typeof field !== "object") {
      continue;
    }

    const candidate = field as Record<string, unknown>;
    const name = candidate.name;
    const label = candidate.label;

    if (!isNonEmptyString(name) || !isNonEmptyString(label)) {
      continue;
    }

    output[name.trim()] = label.trim();
  }

  return output;
}

function getFieldLabel(
  fieldLabels: Record<string, string>,
  key: string,
): string {
  return fieldLabels[key] || key;
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

function buildEmailRowsHtml(
  values: Record<string, string>,
  fieldLabels: Record<string, string>,
): string {
  return Object.entries(values)
    .filter(([key, value]) => {
      if (!value.trim()) return false;
      return !SUBJECT_FIELD_KEYS.has(key);
    })
    .map(([key, value]) => {
      const label = getFieldLabel(fieldLabels, key);
      const escapedValue = escapeHtml(value);

      if (key === "email") {
        return `
          <p style="margin:0 0 16px;">
            <strong>${escapeHtml(label)}</strong><br />
            <a href="mailto:${escapeHtml(value)}" style="color:#2563eb;">
              ${escapedValue}
            </a>
          </p>
        `;
      }

      return `
        <p style="margin:0 0 16px;">
          <strong>${escapeHtml(label)}</strong><br />
          <span style="white-space:pre-wrap;">${escapedValue}</span>
        </p>
      `;
    })
    .join("");
}

function buildEmailHtml(
  values: Record<string, string>,
  fieldLabels: Record<string, string>,
): string {
  const email = values.email;
  const subject = values.subject || values.sujet;
  const rows = buildEmailRowsHtml(values, fieldLabels);

  const footerText = isNonEmptyString(email)
    ? "Vous pouvez répondre directement à cet email pour contacter l’expéditeur."
    : "L’expéditeur n’a pas renseigné d’adresse email. Utilisez les coordonnées indiquées dans le message pour le recontacter.";

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
          rows
            ? `
              <div style="border-top:1px solid #e5e7eb;padding-top:16px;color:#374151;">
                ${rows}
              </div>
            `
            : ""
        }

        <p style="margin:24px 0 0;color:#6b7280;font-size:13px;">
          ${escapeHtml(footerText)}
        </p>
      </div>
    </div>
  `;
}

function buildEmailText(
  values: Record<string, string>,
  fieldLabels: Record<string, string>,
): string {
  const lines = Object.entries(values)
    .filter(([key, value]) => {
      if (!value.trim()) return false;
      return !SUBJECT_FIELD_KEYS.has(key);
    })
    .map(([key, value]) => {
      const label = getFieldLabel(fieldLabels, key);

      return `${label}:\n${value}`;
    });

  const email = values.email;
  const footerText = isNonEmptyString(email)
    ? "Vous pouvez répondre directement à cet email pour contacter l’expéditeur."
    : "L’expéditeur n’a pas renseigné d’adresse email. Utilisez les coordonnées indiquées dans le message pour le recontacter.";

  return [
    "Nouveau message depuis le formulaire de contact",
    "",
    ...lines,
    "",
    footerText,
  ].join("\n");
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
    const fieldLabels = normalizeFieldLabels(body.fields);

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
    const html = buildEmailHtml(values, fieldLabels);
    const text = buildEmailText(values, fieldLabels);

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
