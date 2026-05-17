import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Middleware factory: Validates request body, query, or params against a Zod schema.
 * Returns 400 with detailed field errors on validation failure.
 *
 * @param schema - Zod schema to validate against
 * @param source - Which part of the request to validate (default: "body")
 *
 * @example
 * router.post("/register", validate(registerSchema), controller)
 * router.get("/search", validate(querySchema, "query"), controller)
 */
export const validate = (
  schema: ZodSchema,
  source: "body" | "query" | "params" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      // Replace the original data with the parsed (sanitized + typed) version
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: formattedErrors,
        });
        return;
      }
      next(error);
    }
  };
};
