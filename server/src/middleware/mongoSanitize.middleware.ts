import { RequestHandler } from "express";
import mongoSanitize from "express-mongo-sanitize";

const sanitizeValue = (value: unknown): unknown => {
  if (!value || typeof value !== "object") return value;
  return mongoSanitize.sanitize(value as Record<string, unknown> | unknown[]);
};

/**
 * Express 5 exposes req.query as a getter. The upstream express-mongo-sanitize
 * middleware assigns to req.query directly, so wrap sanitize() and shadow query
 * with a sanitized value.
 */
export const sanitizeRequest: RequestHandler = (req, _res, next) => {
  req.body = sanitizeValue(req.body);
  req.params = sanitizeValue(req.params) as typeof req.params;

  Object.defineProperty(req, "query", {
    value: sanitizeValue(req.query),
    writable: true,
    configurable: true,
    enumerable: true,
  });

  next();
};
