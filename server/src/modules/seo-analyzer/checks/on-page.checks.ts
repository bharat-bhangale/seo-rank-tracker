import type { CheerioAPI } from "cheerio";
import type { SeoCheckResult } from "../seo-analyzer.types";

/**
 * Check: Title Tag
 * Category: onPage
 *
 * Validates title tag existence, length (30-60 chars ideal), and uniqueness.
 */
export function checkTitleTag($: CheerioAPI): SeoCheckResult {
  const title = $("title").first().text().trim();
  const allTitles = $("title");

  if (!title) {
    return {
      name: "title-tag",
      category: "onPage",
      score: 0,
      maxScore: 100,
      severity: "critical",
      message: "Missing title tag. Every page must have a unique title tag.",
      details: { title: null, length: 0 },
    };
  }

  if (allTitles.length > 1) {
    return {
      name: "title-tag",
      category: "onPage",
      score: 30,
      maxScore: 100,
      severity: "warning",
      message: `Multiple title tags found (${allTitles.length}). Only one title tag should exist.`,
      details: { title, length: title.length, count: allTitles.length },
    };
  }

  const length = title.length;
  let score = 100;
  let severity: SeoCheckResult["severity"] = "pass";
  let message = `Title tag is well-optimized (${length} characters).`;

  if (length < 30) {
    score = 60;
    severity = "warning";
    message = `Title tag is too short (${length} chars). Aim for 30-60 characters.`;
  } else if (length > 60) {
    score = 70;
    severity = "info";
    message = `Title tag is slightly long (${length} chars). May be truncated in SERPs. Aim for 30-60 characters.`;
  }

  return {
    name: "title-tag",
    category: "onPage",
    score,
    maxScore: 100,
    severity,
    message,
    details: { title, length },
  };
}

/**
 * Check: Meta Description
 * Category: onPage
 *
 * Validates meta description existence and length (120-160 chars ideal).
 */
export function checkMetaDescription($: CheerioAPI): SeoCheckResult {
  const description = $('meta[name="description"]').attr("content")?.trim() || "";

  if (!description) {
    return {
      name: "meta-description",
      category: "onPage",
      score: 0,
      maxScore: 100,
      severity: "critical",
      message: "Missing meta description. Add a compelling 120-160 character description.",
      details: { description: null, length: 0 },
    };
  }

  const length = description.length;
  let score = 100;
  let severity: SeoCheckResult["severity"] = "pass";
  let message = `Meta description is well-optimized (${length} characters).`;

  if (length < 120) {
    score = 60;
    severity = "warning";
    message = `Meta description is short (${length} chars). Aim for 120-160 characters.`;
  } else if (length > 160) {
    score = 70;
    severity = "info";
    message = `Meta description is long (${length} chars). May be truncated. Aim for 120-160 characters.`;
  }

  return {
    name: "meta-description",
    category: "onPage",
    score,
    maxScore: 100,
    severity,
    message,
    details: { description, length },
  };
}

/**
 * Check: Heading Hierarchy (H1-H6)
 * Category: onPage
 *
 * Validates H1 existence, uniqueness, and proper heading hierarchy.
 */
export function checkHeadings($: CheerioAPI): SeoCheckResult {
  const h1Elements = $("h1");
  const h1Count = h1Elements.length;
  const h1Text = h1Elements.first().text().trim();

  const headingCounts: Record<string, number> = {};
  for (let i = 1; i <= 6; i++) {
    headingCounts[`h${i}`] = $(`h${i}`).length;
  }

  if (h1Count === 0) {
    return {
      name: "headings",
      category: "onPage",
      score: 0,
      maxScore: 100,
      severity: "critical",
      message: "Missing H1 tag. Every page should have exactly one H1.",
      details: { h1Text: null, h1Count, headingCounts },
    };
  }

  if (h1Count > 1) {
    return {
      name: "headings",
      category: "onPage",
      score: 50,
      maxScore: 100,
      severity: "warning",
      message: `Multiple H1 tags found (${h1Count}). Use only one H1 per page.`,
      details: { h1Text, h1Count, headingCounts },
    };
  }

  // Check for hierarchy gaps (e.g., H1 → H3, skipping H2)
  let hasGap = false;
  let lastUsedLevel = 0;
  for (let i = 1; i <= 6; i++) {
    if (headingCounts[`h${i}`] > 0) {
      if (lastUsedLevel > 0 && i - lastUsedLevel > 1) {
        hasGap = true;
      }
      lastUsedLevel = i;
    }
  }

  if (hasGap) {
    return {
      name: "headings",
      category: "onPage",
      score: 70,
      maxScore: 100,
      severity: "info",
      message: "Heading hierarchy has gaps. Use sequential heading levels (H1 → H2 → H3).",
      details: { h1Text, h1Count, headingCounts },
    };
  }

  return {
    name: "headings",
    category: "onPage",
    score: 100,
    maxScore: 100,
    severity: "pass",
    message: "Heading structure is well-organized with proper hierarchy.",
    details: { h1Text, h1Count, headingCounts },
  };
}

/**
 * Check: Image Alt Text
 * Category: onPage
 *
 * Audits images for missing alt attributes.
 */
export function checkImageAlts($: CheerioAPI): SeoCheckResult {
  const images = $("img");
  const totalImages = images.length;

  if (totalImages === 0) {
    return {
      name: "image-alt",
      category: "onPage",
      score: 100,
      maxScore: 100,
      severity: "pass",
      message: "No images found on the page.",
      details: { totalImages: 0, missingAlt: 0 },
    };
  }

  let missingAlt = 0;
  const missingAltSources: string[] = [];

  images.each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt.trim() === "") {
      missingAlt++;
      const src = $(el).attr("src") || "unknown";
      if (missingAltSources.length < 10) {
        missingAltSources.push(src);
      }
    }
  });

  const percentage = ((totalImages - missingAlt) / totalImages) * 100;
  const score = Math.round(percentage);

  let severity: SeoCheckResult["severity"] = "pass";
  let message = `All ${totalImages} images have alt text.`;

  if (missingAlt > 0) {
    severity = percentage < 50 ? "critical" : "warning";
    message = `${missingAlt} of ${totalImages} images are missing alt text.`;
  }

  return {
    name: "image-alt",
    category: "onPage",
    score,
    maxScore: 100,
    severity,
    message,
    details: { totalImages, missingAlt, missingAltSources },
  };
}

/**
 * Check: Open Graph Tags
 * Category: onPage
 *
 * Validates essential OG tags for social sharing.
 */
export function checkOpenGraph($: CheerioAPI): SeoCheckResult {
  const requiredOgTags = ["og:title", "og:description", "og:image", "og:url"];
  const found: Record<string, string> = {};
  const missing: string[] = [];

  for (const tag of requiredOgTags) {
    const content = $(`meta[property="${tag}"]`).attr("content")?.trim();
    if (content) {
      found[tag] = content;
    } else {
      missing.push(tag);
    }
  }

  const score = Math.round((Object.keys(found).length / requiredOgTags.length) * 100);

  let severity: SeoCheckResult["severity"] = "pass";
  let message = "All essential Open Graph tags are present.";

  if (missing.length > 0) {
    severity = missing.length >= 3 ? "warning" : "info";
    message = `Missing Open Graph tags: ${missing.join(", ")}`;
  }

  return {
    name: "open-graph",
    category: "onPage",
    score,
    maxScore: 100,
    severity,
    message,
    details: { found, missing },
  };
}

/**
 * Check: Canonical Tag
 * Category: onPage
 *
 * Validates canonical URL presence and correctness.
 */
export function checkCanonical($: CheerioAPI, url: string): SeoCheckResult {
  const canonical = $('link[rel="canonical"]').attr("href")?.trim();

  if (!canonical) {
    return {
      name: "canonical",
      category: "onPage",
      score: 30,
      maxScore: 100,
      severity: "warning",
      message: "Missing canonical tag. Add a self-referencing canonical URL to prevent duplicate content.",
      details: { canonical: null },
    };
  }

  // Check if canonical is self-referencing
  const isSelfReferencing = canonical === url || canonical === url.replace(/\/$/, "");

  return {
    name: "canonical",
    category: "onPage",
    score: 100,
    maxScore: 100,
    severity: "pass",
    message: isSelfReferencing
      ? "Self-referencing canonical tag is properly set."
      : `Canonical points to a different URL: ${canonical}`,
    details: { canonical, isSelfReferencing },
  };
}
