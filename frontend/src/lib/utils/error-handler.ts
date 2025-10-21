import { AxiosError } from 'axios';

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  timestamp?: string;
}

export class ErrorHandler {
  /**
   * Extract error message from various error types
   */
  static getMessage(error: unknown): string {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as ApiError;
      return apiError?.message || error.message || 'An unexpected error occurred';
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'An unexpected error occurred';
  }

  /**
   * Get error status code
   */
  static getStatusCode(error: unknown): number {
    if (error instanceof AxiosError) {
      return error.response?.status || 500;
    }
    return 500;
  }

  /**
   * Check if error is a specific HTTP status
   */
  static isStatus(error: unknown, status: number): boolean {
    return this.getStatusCode(error) === status;
  }

  /**
   * Check if error is authentication related
   */
  static isAuthError(error: unknown): boolean {
    const status = this.getStatusCode(error);
    return status === 401 || status === 403;
  }

  /**
   * Check if error is a validation error
   */
  static isValidationError(error: unknown): boolean {
    return this.isStatus(error, 400);
  }

  /**
   * Check if error is not found
   */
  static isNotFoundError(error: unknown): boolean {
    return this.isStatus(error, 404);
  }

  /**
   * Check if error is a conflict (duplicate)
   */
  static isConflictError(error: unknown): boolean {
    return this.isStatus(error, 409);
  }

  /**
   * Get user-friendly error message based on status code
   */
  static getUserFriendlyMessage(error: unknown): string {
    const status = this.getStatusCode(error);
    const message = this.getMessage(error);

    switch (status) {
      case 400:
        return `Invalid input: ${message}`;
      case 401:
        return 'Please log in to continue';
      case 403:
        return 'You do not have permission to perform this action';
      case 404:
        return 'The requested resource was not found';
      case 409:
        return `Conflict: ${message}`;
      case 422:
        return `Validation error: ${message}`;
      case 500:
        return 'Server error. Please try again later';
      case 503:
        return 'Service temporarily unavailable. Please try again later';
      default:
        return message;
    }
  }

  /**
   * Format error for toast notification
   */
  static formatForToast(error: unknown): { title: string; description: string } {
    const status = this.getStatusCode(error);
    const message = this.getUserFriendlyMessage(error);

    let title = 'Error';
    if (status === 401 || status === 403) {
      title = 'Authentication Error';
    } else if (status === 404) {
      title = 'Not Found';
    } else if (status === 409) {
      title = 'Conflict';
    } else if (status >= 500) {
      title = 'Server Error';
    }

    return { title, description: message };
  }

  /**
   * Log error to console (can be extended to send to logging service)
   */
  static log(error: unknown, context?: string): void {
    const message = this.getMessage(error);
    const status = this.getStatusCode(error);

    console.error('[ErrorHandler]', {
      context,
      status,
      message,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}
