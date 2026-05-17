import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";

// ── Template Cache ─────────────────────────────────────

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

// ── Handlebars Helpers ─────────────────────────────────

Handlebars.registerHelper("severityEmoji", (severity: string) => {
  const map: Record<string, string> = {
    critical: "🔴",
    warning: "🟡",
    info: "🔵",
    pass: "🟢",
  };
  return map[severity] || "⚪";
});

Handlebars.registerHelper("scoreBar", (score: number) => {
  const filled = Math.round(score / 10);
  const empty = 10 - filled;
  return "█".repeat(filled) + "░".repeat(empty) + ` ${score}/100`;
});

Handlebars.registerHelper("ifEqual", function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
  return a === b ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper("json", (context: unknown) => {
  return JSON.stringify(context, null, 2);
});

Handlebars.registerHelper("truncate", (str: string, len: number) => {
  if (!str) return "";
  return str.length > len ? str.substring(0, len) + "..." : str;
});

Handlebars.registerHelper("add", (a: number, b: number) => a + b);

// ── Partials (common sections reused across templates) ─

const PARTIALS: Record<string, string> = {
  roleDefinition: `You are an expert SEO analyst with 15+ years of experience in technical SEO, content strategy, and search engine algorithms. You provide actionable, data-driven insights.`,

  jsonOutputInstruction: `Respond ONLY with a valid JSON object matching the specified structure. No markdown, no code fences, no additional explanation.`,

  auditContext: `## Website: {{url}}
## Audit Date: {{auditDate}}
## Overall Score: {{overallScore}}/100 (Grade: {{grade}})`,
};

// Register partials
for (const [name, content] of Object.entries(PARTIALS)) {
  Handlebars.registerPartial(name, content);
}

// ── Core Functions ─────────────────────────────────────

/**
 * Get the prompts directory path.
 */
function getPromptsDir(): string {
  return path.join(__dirname, "../prompts");
}

/**
 * Load a template from the file system.
 * Uses an in-memory cache (cleared on hot-reload in dev).
 */
function loadTemplate(templateName: string): HandlebarsTemplateDelegate {
  const cached = templateCache.get(templateName);
  if (cached && process.env.NODE_ENV !== "development") {
    return cached;
  }

  const templatePath = path.join(getPromptsDir(), `${templateName}.hbs`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Prompt template not found: ${templatePath}`);
  }

  const source = fs.readFileSync(templatePath, "utf-8");
  const compiled = Handlebars.compile(source, { noEscape: true });

  templateCache.set(templateName, compiled);
  logger.debug(`Loaded prompt template: ${templateName}`);

  return compiled;
}

/**
 * Render a prompt template with the given data.
 *
 * @param templateName - Name of the .hbs file (without extension)
 * @param data - Template variables
 * @returns Rendered prompt string
 *
 * @example
 * const prompt = renderPrompt("seo-report", { url: "https://example.com", checks: [...] });
 */
export function renderPrompt(templateName: string, data: Record<string, unknown>): string {
  const template = loadTemplate(templateName);
  return template(data);
}

/**
 * List all available prompt templates.
 */
export function listTemplates(): string[] {
  const dir = getPromptsDir();
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".hbs"))
    .map((f) => f.replace(".hbs", ""));
}

/**
 * Preview a rendered template (for development/testing).
 */
export function previewPrompt(
  templateName: string,
  data: Record<string, unknown>
): { rendered: string; estimatedTokens: number } {
  const rendered = renderPrompt(templateName, data);
  // Rough token estimation: ~4 chars per token
  const estimatedTokens = Math.ceil(rendered.length / 4);
  return { rendered, estimatedTokens };
}

/**
 * Clear the template cache (for hot-reload).
 */
export function clearTemplateCache(): void {
  templateCache.clear();
  logger.info("Prompt template cache cleared");
}
