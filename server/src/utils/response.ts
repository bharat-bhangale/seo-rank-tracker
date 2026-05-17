import { Response } from "express";

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Send a standardized success response.
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string
): void => {
  const response: SuccessResponse<T> = { success: true, data };
  if (message) response.message = message;
  res.status(statusCode).json(response);
};

/**
 * Send a paginated response with metadata.
 */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
): void => {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  res.status(200).json(response);
};
