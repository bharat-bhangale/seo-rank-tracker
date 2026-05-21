import type { CheerioAPI } from "cheerio";
import type { SeoCheckResult } from "../seo-analyzer.types";

/**
 * Check for structured data (JSON-LD, Microdata, RDFa) on the page.
 * Validates presence, parses types, and checks for common issues.
 */
export function checkJsonLd($: CheerioAPI): SeoCheckResult {
  const jsonLdScripts = $('script[type="application/ld+json"]');
  const schemas: Array<{ type: string; isValid: boolean; errors: string[] }> = [];

  jsonLdScripts.each((_, el) => {
    const content = $(el).html();
    if (!content) return;

    try {
      const parsed = JSON.parse(content);
      const types = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of types) {
        const type = item["@type"] || "Unknown";
        const errors: string[] = [];

        // Check for required @context
        if (!item["@context"]) {
          errors.push("Missing @context property");
        }

        // Type-specific validation
        if (type === "Article" || type === "NewsArticle" || type === "BlogPosting") {
          if (!item.headline) errors.push("Missing 'headline' (required for Article)");
          if (!item.author) errors.push("Missing 'author' (required for Article)");
          if (!item.datePublished) errors.push("Missing 'datePublished' (recommended)");
          if (!item.image) errors.push("Missing 'image' (recommended for rich results)");
        }

        if (type === "Product") {
          if (!item.name) errors.push("Missing 'name' (required for Product)");
          if (!item.offers) errors.push("Missing 'offers' (required for Product rich result)");
          if (!item.image) errors.push("Missing 'image' (recommended for Product)");
        }

        if (type === "FAQPage") {
          if (!item.mainEntity || !Array.isArray(item.mainEntity)) {
            errors.push("Missing 'mainEntity' array (required for FAQPage)");
          }
        }

        if (type === "Organization" || type === "LocalBusiness") {
          if (!item.name) errors.push("Missing 'name'");
          if (!item.url) errors.push("Missing 'url'");
        }

        if (type === "BreadcrumbList") {
          if (!item.itemListElement) errors.push("Missing 'itemListElement'");
        }

        schemas.push({
          type,
          isValid: errors.length === 0,
          errors,
        });
      }
    } catch {
      schemas.push({
        type: "Invalid JSON",
        isValid: false,
        errors: ["JSON-LD contains invalid JSON"],
      });
    }
  });

  if (schemas.length === 0) {
    return {
      name: "JSON-LD Structured Data",
      category: "content",
      score: 0,
      maxScore: 100,
      severity: "warning",
      message: "No JSON-LD structured data found. Add schema markup for rich snippet eligibility.",
      details: {
        suggestion: "Consider adding Organization, Article, BreadcrumbList, or FAQ schema",
      },
    };
  }

  const validSchemas = schemas.filter((s) => s.isValid);
  const totalIssues = schemas.reduce((sum, s) => sum + s.errors.length, 0);
  const score = Math.round(
    (validSchemas.length / schemas.length) * 100 - totalIssues * 5
  );

  return {
    name: "JSON-LD Structured Data",
    category: "content",
    score: Math.max(0, Math.min(100, score)),
    maxScore: 100,
    severity: totalIssues > 0 ? "warning" : "pass",
    message:
      totalIssues > 0
        ? `Found ${schemas.length} schema type(s) with ${totalIssues} issue(s)`
        : `Found ${schemas.length} valid schema type(s)`,
    details: { schemas },
  };
}

/**
 * Check for Microdata structured data (itemprop, itemtype, itemscope).
 */
export function checkMicrodata($: CheerioAPI): SeoCheckResult {
  const microdataElements = $("[itemscope]");
  const types: string[] = [];

  microdataElements.each((_, el) => {
    const itemtype = $(el).attr("itemtype");
    if (itemtype) types.push(itemtype);
  });

  if (types.length === 0) {
    return {
      name: "Microdata Markup",
      category: "content",
      score: 50, // Neutral — JSON-LD is preferred
      maxScore: 100,
      severity: "info",
      message: "No Microdata markup found (JSON-LD is the recommended format).",
      details: { types },
    };
  }

  return {
    name: "Microdata Markup",
    category: "content",
    score: 80,
    maxScore: 100,
    severity: "pass",
    message: `Found ${types.length} Microdata type(s): ${types.join(", ")}`,
    details: { types },
  };
}

/**
 * Check for Open Graph and Twitter Card structured data.
 * These aren't schema.org but are critical for social sharing rich previews.
 */
export function checkSocialMeta($: CheerioAPI): SeoCheckResult {
  const ogTags: Record<string, string> = {};
  const twitterTags: Record<string, string> = {};
  const issues: string[] = [];

  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr("property") || "";
    const content = $(el).attr("content") || "";
    ogTags[prop] = content;
  });

  $('meta[name^="twitter:"]').each((_, el) => {
    const name = $(el).attr("name") || "";
    const content = $(el).attr("content") || "";
    twitterTags[name] = content;
  });

  // Check required OG tags
  if (!ogTags["og:title"]) issues.push("Missing og:title");
  if (!ogTags["og:description"]) issues.push("Missing og:description");
  if (!ogTags["og:image"]) issues.push("Missing og:image");
  if (!ogTags["og:url"]) issues.push("Missing og:url");
  if (!ogTags["og:type"]) issues.push("Missing og:type");

  // Check Twitter Card
  if (!twitterTags["twitter:card"]) issues.push("Missing twitter:card");

  const totalTags = Object.keys(ogTags).length + Object.keys(twitterTags).length;
  const score = totalTags === 0 ? 0 : Math.max(0, 100 - issues.length * 15);

  return {
    name: "Social Meta Tags",
    category: "content",
    score: Math.min(100, score),
    maxScore: 100,
    severity: issues.length > 2 ? "warning" : issues.length > 0 ? "info" : "pass",
    message:
      issues.length > 0
        ? `Social meta tags have ${issues.length} issue(s)`
        : "Social meta tags are well configured",
    details: {
      ogTags,
      twitterTags,
      issues,
    },
  };
}
