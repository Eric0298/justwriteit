export class PublicApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.name = "PublicApiError";
    this.status = status;
    this.code = code;
  }
}

export function toPublicError(error: unknown, fallback: string): {
  message: string;
  status: number;
  code?: string;
} {
  if (error instanceof PublicApiError) {
    return { message: error.message, status: error.status, code: error.code };
  }

  return { message: fallback, status: 500 };
}

