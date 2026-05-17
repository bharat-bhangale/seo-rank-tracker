import { GoogleGenerativeAI, GenerativeModel, Content } from "@google/generative-ai";
import { LRUCache } from "lru-cache";
import { ZodSchema } from "zod";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { AppError } from "../utils/AppError";

// ── Types ──────────────────────────────────────────────

export interface GeminiRequestOptions {
  /** Use Pro model for deeper analysis (default: Flash) */
  useProModel?: boolean;
  /** Temperature (0-2, default 0.7) */
  temperature?: number;
  /** Maximum output tokens */
  maxOutputTokens?: number;
  /** Enable response caching */
  cache?: boolean;
  /** User ID for usage tracking */
  userId?: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  estimatedCostUsd: number;
}

// ── Cost constants (approximate pricing per 1M tokens) ─

const COST_PER_1M_INPUT: Record<string, number> = {
  "gemini-2.5-flash": 0.15,
  "gemini-2.5-pro": 1.25,
};

const COST_PER_1M_OUTPUT: Record<string, number> = {
  "gemini-2.5-flash": 0.60,
  "gemini-2.5-pro": 10.0,
};

// ── LRU Cache (24-hour TTL, max 500 entries) ───────────

const responseCache = new LRUCache<string, string>({
  max: 500,
  ttl: 24 * 60 * 60 * 1000,
});

// ── Service ────────────────────────────────────────────

class GeminiService {
  private client: GoogleGenerativeAI;
  private flashModel: GenerativeModel;
  private proModel: GenerativeModel;

  constructor() {
    this.client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.flashModel = this.client.getGenerativeModel({ model: env.GEMINI_FLASH_MODEL });
    this.proModel = this.client.getGenerativeModel({ model: env.GEMINI_PRO_MODEL });
  }

  /**
   * Select the appropriate model based on options.
   */
  private getModel(useProModel?: boolean): GenerativeModel {
    return useProModel ? this.proModel : this.flashModel;
  }

  /**
   * Get the model name string for logging/cost tracking.
   */
  private getModelName(useProModel?: boolean): string {
    return useProModel ? env.GEMINI_PRO_MODEL : env.GEMINI_FLASH_MODEL;
  }

  /**
   * Calculate estimated cost from token usage.
   */
  private calculateCost(
    promptTokens: number,
    completionTokens: number,
    modelName: string
  ): number {
    const inputCost = (promptTokens / 1_000_000) * (COST_PER_1M_INPUT[modelName] || 0.15);
    const outputCost = (completionTokens / 1_000_000) * (COST_PER_1M_OUTPUT[modelName] || 0.60);
    return parseFloat((inputCost + outputCost).toFixed(6));
  }

  /**
   * Generate a plain-text response from Gemini.
   */
  async generateText(
    prompt: string,
    options: GeminiRequestOptions = {}
  ): Promise<{ text: string; usage: TokenUsage }> {
    const {
      useProModel = false,
      temperature = 0.7,
      maxOutputTokens = 4096,
      cache = false,
    } = options;

    // Check cache
    const cacheKey = `text:${useProModel}:${prompt.slice(0, 200)}`;
    if (cache) {
      const cached = responseCache.get(cacheKey);
      if (cached) {
        logger.debug("Gemini cache hit");
        return {
          text: cached,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, model: this.getModelName(useProModel), estimatedCostUsd: 0 },
        };
      }
    }

    const model = this.getModel(useProModel);
    const modelName = this.getModelName(useProModel);

    const result = await this.callWithRetry(async () => {
      return model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
        },
      });
    });

    const text = result.response.text();
    const usageMetadata = result.response.usageMetadata;
    const promptTokens = usageMetadata?.promptTokenCount || 0;
    const completionTokens = usageMetadata?.candidatesTokenCount || 0;

    const usage: TokenUsage = {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      model: modelName,
      estimatedCostUsd: this.calculateCost(promptTokens, completionTokens, modelName),
    };

    logger.info(`Gemini ${modelName}: ${usage.totalTokens} tokens ($${usage.estimatedCostUsd})`);

    if (cache) {
      responseCache.set(cacheKey, text);
    }

    return { text, usage };
  }

  /**
   * Generate a structured JSON response from Gemini, validated with Zod.
   */
  async generateStructured<T>(
    prompt: string,
    schema: ZodSchema<T>,
    options: GeminiRequestOptions = {}
  ): Promise<{ data: T; usage: TokenUsage }> {
    const {
      useProModel = false,
      temperature = 0.4,
      maxOutputTokens = 8192,
      cache = false,
    } = options;

    // Augment prompt with JSON instruction
    const structuredPrompt = `${prompt}\n\n---\nIMPORTANT: Respond ONLY with a valid JSON object. No markdown, no code fences, no explanation.`;

    const cacheKey = `struct:${useProModel}:${structuredPrompt.slice(0, 200)}`;
    if (cache) {
      const cached = responseCache.get(cacheKey);
      if (cached) {
        const parsed = schema.parse(JSON.parse(cached));
        return {
          data: parsed,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, model: this.getModelName(useProModel), estimatedCostUsd: 0 },
        };
      }
    }

    const model = this.getModel(useProModel);
    const modelName = this.getModelName(useProModel);

    const result = await this.callWithRetry(async () => {
      return model.generateContent({
        contents: [{ role: "user", parts: [{ text: structuredPrompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseMimeType: "application/json",
        },
      });
    });

    const rawText = result.response.text();
    const usageMetadata = result.response.usageMetadata;
    const promptTokens = usageMetadata?.promptTokenCount || 0;
    const completionTokens = usageMetadata?.candidatesTokenCount || 0;

    const usage: TokenUsage = {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      model: modelName,
      estimatedCostUsd: this.calculateCost(promptTokens, completionTokens, modelName),
    };

    // Parse and validate with Zod
    let parsed: T;
    try {
      const jsonString = this.extractJsonFromResponse(rawText);
      parsed = schema.parse(JSON.parse(jsonString));
    } catch (error: any) {
      logger.error(`Gemini structured output validation failed: ${error.message}`);
      throw new AppError("AI generated invalid output. Please try again.", 500);
    }

    logger.info(`Gemini ${modelName} (structured): ${usage.totalTokens} tokens ($${usage.estimatedCostUsd})`);

    if (cache) {
      responseCache.set(cacheKey, JSON.stringify(parsed));
    }

    return { data: parsed, usage };
  }

  /**
   * Multi-turn chat for interactive analysis.
   */
  async chat(
    history: Content[],
    message: string,
    options: GeminiRequestOptions = {}
  ): Promise<{ text: string; usage: TokenUsage }> {
    const { useProModel = false, temperature = 0.7, maxOutputTokens = 4096 } = options;
    const model = this.getModel(useProModel);
    const modelName = this.getModelName(useProModel);

    const chat = model.startChat({
      history,
      generationConfig: { temperature, maxOutputTokens },
    });

    const result = await this.callWithRetry(async () => {
      return chat.sendMessage(message);
    });

    const text = result.response.text();
    const usageMetadata = result.response.usageMetadata;
    const promptTokens = usageMetadata?.promptTokenCount || 0;
    const completionTokens = usageMetadata?.candidatesTokenCount || 0;

    return {
      text,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        model: modelName,
        estimatedCostUsd: this.calculateCost(promptTokens, completionTokens, modelName),
      },
    };
  }

  /**
   * Extract JSON from a response that might include markdown fences.
   */
  private extractJsonFromResponse(text: string): string {
    // Remove markdown code fences if present
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      return fenceMatch[1].trim();
    }

    // Try to find JSON object/array
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }

    return text.trim();
  }

  /**
   * Retry logic with exponential backoff for transient Gemini API errors.
   */
  private async callWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Don't retry on non-retryable errors
        if (error.status === 400 || error.status === 403) {
          throw new AppError(`Gemini API error: ${error.message}`, error.status);
        }

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          logger.warn(`Gemini API retry ${attempt + 1}/${maxRetries} after ${delay}ms: ${error.message}`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new AppError(`Gemini API failed after ${maxRetries} retries: ${lastError?.message}`, 502);
  }

  /**
   * Clear the response cache (useful for testing or manual invalidation).
   */
  clearCache(): void {
    responseCache.clear();
    logger.info("Gemini response cache cleared");
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
