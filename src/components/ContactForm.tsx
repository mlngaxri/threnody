"use client";

import { useId, useRef, useState } from "react";

/**
 * The enquiry flow. Deliberately a real form with real server validation
 * rather than a decorative one.
 *
 * Accessibility decisions worth stating:
 * - Errors are announced once, as a complete list, in a single aria-live
 *   region, and focus is moved to that summary so a screen reader user is not
 *   left guessing what happened.
 * - Every invalid field gets aria-invalid and aria-describedby pointing at its
 *   own message, so the error is reachable from the field as well.
 * - The submit button reports its own pending state in text, not only by
 *   spinner, and is disabled while in flight to prevent double submission.
 * - The honeypot is hidden from everyone including screen readers, is not
 *   focusable, and has autocomplete off.
 */

type Status = "idle" | "pending" | "success" | "error";

const SUBJECTS = [
  { value: "correction", label: "Correct something in an entry" },
  { value: "contribute", label: "Offer a recording or a source" },
  { value: "permissions", label: "Ask about permissions or reuse" },
  { value: "general", label: "Something else" },
] as const;

interface Props {
  /** Pre-selects the entry an enquiry refers to. */
  entrySlugs: Array<{ slug: string; title: string }>;
  defaultSlug?: string;
}

export function ContactForm({ entrySlugs, defaultSlug = "" }: Props) {
  const uid = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState("");
  const [reference, setReference] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);

  const fid = (name: string) => `${uid}-${name}`;
  const errId = (name: string) => `${uid}-${name}-error`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "pending") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      subject: String(data.get("subject") ?? ""),
      message: String(data.get("message") ?? ""),
      entrySlug: String(data.get("entrySlug") ?? "") || undefined,
      website: String(data.get("website") ?? ""),
    };

    setStatus("pending");
    setFieldErrors({});
    setFormMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result?.ok) {
        setStatus("success");
        setReference(String(result.data?.reference ?? ""));
        form.reset();
        window.requestAnimationFrame(() => summaryRef.current?.focus());
        return;
      }

      setStatus("error");
      const error = result?.error;
      if (error?.fields && typeof error.fields === "object") {
        setFieldErrors(error.fields as Record<string, string>);
      }
      setFormMessage(
        typeof error?.message === "string"
          ? error.message
          : `The archive could not accept that (status ${response.status}). Nothing was sent.`,
      );
    } catch {
      // Network failure, offline, or the request was aborted.
      setStatus("error");
      setFormMessage(
        "The request never reached the archive. This is usually a lost connection. Your text is still in the form, so you can try again without retyping it.",
      );
    } finally {
      window.requestAnimationFrame(() => summaryRef.current?.focus());
    }
  }

  const errorList = Object.entries(fieldErrors);

  if (status === "success") {
    return (
      <div className="state" role="status" tabIndex={-1} ref={summaryRef}>
        <h2 className="state__title">Received.</h2>
        <p className="state__body">
          Your enquiry is logged against reference {reference || "pending"}. Corrections are read by
          the contributor responsible for the entry, not by a general inbox, so a reply can take a
          few days.
        </p>
        <button type="button" className="btn" onClick={() => setStatus("idle")}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Single announcement point for the whole form. */}
      <div
        ref={summaryRef}
        tabIndex={-1}
        aria-live="assertive"
        aria-atomic="true"
        style={{ outline: "none" }}
      >
        {status === "error" ? (
          <div className="state state--error" role="alert">
            <h2 className="state__title" style={{ fontSize: "var(--step-1)" }}>
              That did not send
            </h2>
            <p className="state__body">{formMessage}</p>
            {errorList.length > 0 ? (
              <ul style={{ display: "grid", gap: "var(--sp-2)" }}>
                {errorList.map(([field, message]) => (
                  <li key={field}>
                    {field === "_form" ? (
                      message
                    ) : (
                      <a href={`#${fid(field)}`}>
                        {field}: {message}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        style={{
          marginBlockStart: "var(--sp-6)",
          display: "grid",
          gap: "var(--sp-5)",
          maxWidth: "38rem",
        }}
      >
        <div className="field">
          <label className="field__label" htmlFor={fid("name")}>
            Your name
          </label>
          <input
            className="input"
            id={fid("name")}
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors.name) || undefined}
            aria-describedby={fieldErrors.name ? errId("name") : undefined}
          />
          {fieldErrors.name ? (
            <span className="field__error" id={errId("name")}>
              {fieldErrors.name}
            </span>
          ) : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor={fid("email")}>
            Email
          </label>
          <input
            className="input"
            id={fid("email")}
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email) || undefined}
            aria-describedby={
              fieldErrors.email ? `${errId("email")} ${uid}-email-hint` : `${uid}-email-hint`
            }
          />
          <span className="field__hint" id={`${uid}-email-hint`}>
            Used only to reply to this enquiry. It is not stored for any other purpose.
          </span>
          {fieldErrors.email ? (
            <span className="field__error" id={errId("email")}>
              {fieldErrors.email}
            </span>
          ) : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor={fid("subject")}>
            What is this about
          </label>
          <select
            className="input"
            id={fid("subject")}
            name="subject"
            defaultValue="correction"
            aria-invalid={Boolean(fieldErrors.subject) || undefined}
            aria-describedby={fieldErrors.subject ? errId("subject") : undefined}
          >
            {SUBJECTS.map((subject) => (
              <option key={subject.value} value={subject.value}>
                {subject.label}
              </option>
            ))}
          </select>
          {fieldErrors.subject ? (
            <span className="field__error" id={errId("subject")}>
              {fieldErrors.subject}
            </span>
          ) : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor={fid("entrySlug")}>
            Which entry <span style={{ textTransform: "none" }}>(optional)</span>
          </label>
          <select
            className="input"
            id={fid("entrySlug")}
            name="entrySlug"
            defaultValue={defaultSlug}
            aria-invalid={Boolean(fieldErrors.entrySlug) || undefined}
            aria-describedby={fieldErrors.entrySlug ? errId("entrySlug") : undefined}
          >
            <option value="">Not about a specific entry</option>
            {entrySlugs.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {entry.title}
              </option>
            ))}
          </select>
          {fieldErrors.entrySlug ? (
            <span className="field__error" id={errId("entrySlug")}>
              {fieldErrors.entrySlug}
            </span>
          ) : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor={fid("message")}>
            Your message
          </label>
          <textarea
            className="input textarea"
            id={fid("message")}
            name="message"
            required
            minLength={20}
            maxLength={2000}
            rows={7}
            aria-invalid={Boolean(fieldErrors.message) || undefined}
            aria-describedby={
              fieldErrors.message ? `${errId("message")} ${uid}-message-hint` : `${uid}-message-hint`
            }
          />
          <span className="field__hint" id={`${uid}-message-hint`}>
            Between 20 and 2000 characters. If you are correcting something, a citation is worth
            more than an argument.
          </span>
          {fieldErrors.message ? (
            <span className="field__error" id={errId("message")}>
              {fieldErrors.message}
            </span>
          ) : null}
        </div>

        {/* Honeypot. Hidden from sighted users and assistive technology alike,
            and unreachable by keyboard, so only a script will ever fill it. */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
          <label htmlFor={fid("website")}>Leave this empty</label>
          <input
            id={fid("website")}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div style={{ display: "flex", gap: "var(--sp-4)", alignItems: "center" }}>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={status === "pending"}
            aria-disabled={status === "pending" || undefined}
          >
            {status === "pending" ? "Sending your enquiry" : "Send enquiry"}
          </button>
          {status === "pending" ? (
            <span className="eyebrow" role="status">
              Contacting the archive
            </span>
          ) : null}
        </div>
      </div>
    </form>
  );
}
