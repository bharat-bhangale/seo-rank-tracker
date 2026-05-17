import type { CheerioAPI } from "cheerio";
import type { SeoCheckResult } from "../seo-analyzer.types";

/**
 * Check: Content Length
 * Category: content
 *
 * Evaluates the word count of the page's body text.
 */
export function checkContentLength($: CheerioAPI): SeoCheckResult {
  // Remove scripts, styles, and navigation to get pure content
  const bodyClone = $("body").clone();
  bodyClone.find("script, style, nav, header, footer, noscript").remove();
  const text = bodyClone.text().replace(/\s+/g, " ").trim();
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

  let score = 100;
  let severity: SeoCheckResult["severity"] = "pass";
  let message = `Content has ${wordCount} words, which is good for SEO.`;

  if (wordCount < 100) {
    score = 20;
    severity = "critical";
    message = `Very thin content (${wordCount} words). Aim for at least 300 words.`;
  } else if (wordCount < 300) {
    score = 50;
    severity = "warning";
    message = `Content is thin (${wordCount} words). Consider expanding to 300+ words.`;
  } else if (wordCount < 600) {
    score = 75;
    severity = "info";
    message = `Content is okay (${wordCount} words) but could be more comprehensive.`;
  }

  return {
    name: "content-length",
    category: "content",
    score,
    maxScore: 100,
    severity,
    message,
    details: { wordCount },
  };
}

/**
 * Check: Internal Links
 * Category: content
 *
 * Evaluates internal link count and quality.
 */
export function checkInternalLinks($: CheerioAPI, url: string): SeoCheckResult {
  const links = $("a[href]");
  let internalLinks = 0;
  let externalLinks = 0;
  let noFollowLinks = 0;

  let urlOrigin: string;
  try {
    urlOrigin = new URL(url).origin;
  } catch {
    urlOrigin = "";
  }

  links.each((_, el) => {
    const href = $(el).attr("href") || "";
    const rel = $(el).attr("rel") || "";

    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return; // Skip anchors and non-HTTP links
    }

    try {
      const linkUrl = new URL(href, url);
      if (linkUrl.origin === urlOrigin) {
        internalLinks++;
      } else {
        externalLinks++;
      }
    } catch {
      internalLinks++; // Relative URLs are internal
    }

    if (rel.includes("nofollow")) {
      noFollowLinks++;
    }
  });

  const totalLinks = internalLinks + externalLinks;
  let score = 100;
  let severity: SeoCheckResult["severity"] = "pass";
  let message = `Found ${internalLinks} internal and ${externalLinks} external links.`;

  if (internalLinks === 0) {
    score = 30;
    severity = "warning";
    message = "No internal links found. Add internal links to improve site structure.";
  } else if (internalLinks < 3) {
    score = 60;
    severity = "info";
    message = `Only ${internalLinks} internal links. Consider adding more for better navigation.`;
  }

  return {
    name: "internal-links",
    category: "content",
    score,
    maxScore: 100,
    severity,
    message,
    details: { internalLinks, externalLinks, totalLinks, noFollowLinks },
  };
}

/**
 * Check: Structured Data (JSON-LD)
 * Category: content
 *
 * Detects JSON-LD structured data on the page.
 */
export function checkStructuredData($: CheerioAPI): SeoCheckResult {
  const jsonLdScripts = $('script[type="application/ld+json"]');
  const schemas: Array<{ type: string }> = [];

  jsonLdScripts.each((_, el) => {
    try {
      const content = $(el).html() || "";
      const parsed = JSON.parse(content);

      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (item["@type"]) schemas.push({ type: item["@type"] });
        });
      } else if (parsed["@type"]) {
        schemas.push({ type: parsed["@type"] });
      } else if (parsed["@graph"]) {
        parsed["@graph"].forEach((item: any) => {
          if (item["@type"]) schemas.push({ type: item["@type"] });
        });
      }
    } catch {
      // Invalid JSON-LD
    }
  });

  if (schemas.length === 0) {
    return {
      name: "structured-data",
      category: "content",
      score: 40,
      maxScore: 100,
      severity: "warning",
      message: "No structured data (JSON-LD) found. Add schema markup for rich snippets.",
      details: { schemaCount: 0, types: [] },
    };
  }

  const types = schemas.map((s) => s.type);
  return {
    name: "structured-data",
    category: "content",
    score: 100,
    maxScore: 100,
    severity: "pass",
    message: `Found ${schemas.length} schema type(s): ${types.join(", ")}`,
    details: { schemaCount: schemas.length, types },
  };
}
