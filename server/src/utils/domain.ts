/**
 * Normalize a user-entered domain or URL to a lower-case hostname.
 */
export const normalizeDomain = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return trimmed;

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(withProtocol).hostname.replace(/^www\./, "");
  } catch {
    return trimmed
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .split("?")[0]
      .trim();
  }
};

/**
 * Return the hostname for a URL-like value.
 */
export const getHostname = (value?: string): string | undefined => {
  if (!value) return undefined;

  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    const normalized = normalizeDomain(value);
    return normalized || undefined;
  }
};

/**
 * Match a result URL against the tracked domain, including subdomains.
 */
export const domainMatchesUrl = (domain: string, url?: string): boolean => {
  const normalizedDomain = normalizeDomain(domain);
  const hostname = getHostname(url);

  if (!hostname) return false;
  return hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`);
};
