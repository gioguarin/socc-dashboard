/**
 * Standardized API response utilities.
 *
 * All API endpoints should use these helpers to ensure consistent
 * response structure across the application.
 */

import type { Response } from 'express';

export interface ApiResponse<T = any> {
  success: true;
  data: T;
  anomaly?: AnomalyInfo | null;
  meta?: ResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

export interface AnomalyInfo {
  detected: boolean;
  message?: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface ResponseMeta {
  timestamp?: string;
  count?: number;
  page?: number;
  totalPages?: number;
  [key: string]: any;
}

/**
 * Send a successful API response with consistent structure.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  options?: {
    anomaly?: AnomalyInfo | null;
    meta?: ResponseMeta;
    status?: number;
  }
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (options?.anomaly) {
    response.anomaly = options.anomaly;
  }

  if (options?.meta) {
    response.meta = options.meta;
  }

  res.status(options?.status || 200).json(response);
}

/**
 * Send an error response with consistent structure.
 */
export function sendError(
  res: Response,
  message: string,
  options?: {
    status?: number;
    code?: string;
    details?: any;
  }
): void {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      message,
      code: options?.code,
      details: options?.details,
    },
  };

  res.status(options?.status || 500).json(response);
}

/**
 * Send a 400 Bad Request error.
 */
export function sendBadRequest(res: Response, message: string, details?: any): void {
  sendError(res, message, { status: 400, code: 'BAD_REQUEST', details });
}

/**
 * Send a 401 Unauthorized error.
 */
export function sendUnauthorized(res: Response, message: string = 'Unauthorized'): void {
  sendError(res, message, { status: 401, code: 'UNAUTHORIZED' });
}

/**
 * Send a 403 Forbidden error.
 */
export function sendForbidden(res: Response, message: string = 'Forbidden'): void {
  sendError(res, message, { status: 403, code: 'FORBIDDEN' });
}

/**
 * Send a 404 Not Found error.
 */
export function sendNotFound(res: Response, message: string = 'Resource not found'): void {
  sendError(res, message, { status: 404, code: 'NOT_FOUND' });
}

/**
 * Send a 500 Internal Server Error.
 */
export function sendServerError(res: Response, message: string = 'Internal server error', details?: any): void {
  sendError(res, message, { status: 500, code: 'INTERNAL_ERROR', details });
}

/**
 * Wrap existing data with anomaly detection result.
 * Maintains backward compatibility with existing anomaly-wrapped responses.
 */
export function wrapWithAnomaly<T>(data: T, anomaly: AnomalyInfo | null): ApiResponse<T> {
  return {
    success: true,
    data,
    anomaly,
  };
}
