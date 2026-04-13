const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function normalizeEmailAddress(value: string) {
  return value.trim().toLowerCase();
}

export function sanitizePlainText(value: string, maxLength?: number) {
  const sanitized = value.replace(CONTROL_CHARACTERS, "").trim();

  if (typeof maxLength === "number") {
    return sanitized.slice(0, maxLength);
  }

  return sanitized;
}

export function sanitizeOptionalPlainText(
  value: string | null | undefined,
  maxLength?: number,
) {
  if (!value) {
    return null;
  }

  const sanitized = sanitizePlainText(value, maxLength);

  return sanitized.length > 0 ? sanitized : null;
}

export function sanitizeOptionalUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  const parsedUrl = new URL(normalizedValue);

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed.");
  }

  return parsedUrl.toString();
}

export function assertSameOriginRequest(request: Request) {
  const targetUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin && origin !== targetUrl.origin) {
    throw new Error("Cross-origin requests are not allowed.");
  }

  if (referer) {
    const refererOrigin = new URL(referer).origin;

    if (refererOrigin !== targetUrl.origin) {
      throw new Error("Cross-origin requests are not allowed.");
    }
  }
}
