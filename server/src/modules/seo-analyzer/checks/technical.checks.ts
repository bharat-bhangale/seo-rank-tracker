import type { CheerioAPI } from "cheerio";
import type { SeoCheckResult } from "../seo-analyzer.types";

/**
 * Check: Robots Meta Tag
 * Category: technical
 *
 * Validates robots meta directives (noindex, nofollow detection).
 */
export function checkRobotsMeta($: CheerioAPI): SeoCheckResult {
  const robotsMeta = $('meta[name="robots"]').attr("content")?.toLowerCase().trim() || "";
  const googlebotMeta = $('meta[name="googlebot"]').attr("content")?.toLowerCase().trim() || "";

  const combined = `${robotsMeta} ${googlebotMeta}`;
  const hasNoindex = combined.includes("noindex");
  const hasNofollow = combined.includes("nofollow");

  if (hasNoindex) {
    return {
      name: "robots-meta",
      category: "technical",
      score: 0,
      maxScore: 100,
      severity: "critical",
      message: "Page is set to noindex. It will not appear in search results.",
      details: { robotsMeta, googlebotMeta, hasNoindex, hasNofollow },
    };
  }

  if (hasNofollow) {
    return {
      name: "robots-meta",
      category: "technical",
      score: 50,
      maxScore: 100,
      severity: "warning",
      message: "Page has nofollow directive. Links on this page won't pass PageRank.",
      details: { robotsMeta, googlebotMeta, hasNoindex, hasNofollow },
    };
  }

  return {
    name: "robots-meta",
    category: "technical",
    score: 100,
    maxScore: 100,
    severity: "pass",
    message: "No blocking robots directives found. Page is indexable.",
    details: { robotsMeta, googlebotMeta, hasNoindex, hasNofollow },
  };
}

/**
 * Check: HTTPS / SSL
 * Category: technical
 *
 * Validates that the page is served over HTTPS.
 */
export function checkHttps(url: string): SeoCheckResult {
  const isHttps = url.startsWith("https://");

  if (!isHttps) {
    return {
      name: "https",
      category: "technical",
      score: 0,
      maxScore: 100,
      severity: "critical",
      message: "Page is not served over HTTPS. SSL is required for SEO and user trust.",
      details: { isHttps, url },
    };
  }

  return {
    name: "https",
    category: "technical",
    score: 100,
    maxScore: 100,
    severity: "pass",
    message: "Page is served over HTTPS.",
    details: { isHttps, url },
  };
}

/**
 * Check: Mixed Content
 * Category: technical
 *
 * Detects HTTP resources loaded on an HTTPS page.
 */
export function checkMixedContent($: CheerioAPI, url: string): SeoCheckResult {
  if (!url.startsWith("https://")) {
    return {
      name: "mixed-content",
      category: "technical",
      score: 100,
      maxScore: 100,
      severity: "pass",
      message: "Page is HTTP, so mixed content check is not applicable.",
    };
  }

  const httpResources: string[] = [];
  const resourceSelectors = [
    { selector: "script[src]", attr: "src" },
    { selector: "link[href]", attr: "href" },
    { selector: "img[src]", attr: "src" },
    { selector: "iframe[src]", attr: "src" },
    { selector: "video[src]", attr: "src" },
    { selector: "audio[src]", attr: "src" },
  ];

  for (const { selector, attr } of resourceSelectors) {
    $(selector).each((_, el) => {
      const value = $(el).attr(attr) || "";
      if (value.startsWith("http://")) {
        if (httpResources.length < 20) {
          httpResources.push(value);
        }
      }
    });
  }

  if (httpResources.length > 0) {
    return {
      name: "mixed-content",
      category: "technical",
      score: Math.max(0, 100 - httpResources.length * 15),
      maxScore: 100,
      severity: httpResources.length > 3 ? "critical" : "warning",
      message: `${httpResources.length} HTTP resource(s) found on HTTPS page (mixed content).`,
      details: { count: httpResources.length, resources: httpResources },
    };
  }

  return {
    name: "mixed-content",
    category: "technical",
    score: 100,
    maxScore: 100,
    severity: "pass",
    message: "No mixed content detected.",
  };
}

/**
 * Check: Hreflang Tags
 * Category: technical
 *
 * Validates hreflang implementation for multilingual sites.
 */
export function checkHreflang($: CheerioAPI): SeoCheckResult {
  const hreflangTags = $('link[rel="alternate"][hreflang]');
  const count = hreflangTags.length;

  if (count === 0) {
    return {
      name: "hreflang",
      category: "technical",
      score: 100,
      maxScore: 100,
      severity: "pass",
      message: "No hreflang tags found (not required for single-language sites).",
      details: { count: 0 },
    };
  }

  const languages: string[] = [];
  let hasSelfReference = false;

  hreflangTags.each((_, el) => {
    const lang = $(el).attr("hreflang") || "";
    const href = $(el).attr("href") || "";
    languages.push(lang);
    if (lang === "x-default" || href) {
      hasSelfReference = true;
    }
  });

  const hasXDefault = languages.includes("x-default");

  let score = 100;
  let severity: SeoCheckResult["severity"] = "pass";
  let message = `${count} hreflang tags found for languages: ${languages.join(", ")}`;

  if (!hasXDefault) {
    score = 80;
    severity = "info";
    message += ". Missing x-default hreflang tag.";
  }

  return {
    name: "hreflang",
    category: "technical",
    score,
    maxScore: 100,
    severity,
    message,
    details: { count, languages, hasXDefault, hasSelfReference },
  };
}

/**
 * Check: Viewport Meta Tag
 * Category: technical
 *
 * Validates mobile viewport configuration.
 */
export function checkViewport($: CheerioAPI): SeoCheckResult {
  const viewport = $('meta[name="viewport"]').attr("content")?.trim();

  if (!viewport) {
    return {
      name: "viewport",
      category: "technical",
      score: 0,
      maxScore: 100,
      severity: "critical",
      message: "Missing viewport meta tag. Required for mobile-friendly rendering.",
      details: { viewport: null },
    };
  }

  const hasWidth = viewport.includes("width=device-width");
  const hasInitialScale = viewport.includes("initial-scale=1");

  if (!hasWidth) {
    return {
      name: "viewport",
      category: "technical",
      score: 50,
      maxScore: 100,
      severity: "warning",
      message: "Viewport tag is missing 'width=device-width'.",
      details: { viewport, hasWidth, hasInitialScale },
    };
  }

  return {
    name: "viewport",
    category: "technical",
    score: 100,
    maxScore: 100,
    severity: "pass",
    message: "Viewport meta tag is properly configured for mobile.",
    details: { viewport, hasWidth, hasInitialScale },
  };
}

/**
 * Check: Language Declaration
 * Category: technical
 *
 * Validates HTML lang attribute.
 */
export function checkLangAttribute($: CheerioAPI): SeoCheckResult {
  const lang = $("html").attr("lang")?.trim();

  if (!lang) {
    return {
      name: "lang-attribute",
      category: "technical",
      score: 30,
      maxScore: 100,
      severity: "warning",
      message: "Missing lang attribute on <html> tag. Helps search engines understand the page language.",
      details: { lang: null },
    };
  }

  return {
    name: "lang-attribute",
    category: "technical",
    score: 100,
    maxScore: 100,
    severity: "pass",
    message: `Language attribute set to "${lang}".`,
    details: { lang },
  };
}
