export class PublicApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "PublicApiError";
    this.status = status;
  }
}

export function toPublicError(error: unknown, fallback: string): {
  message: string;
  status: number;
} {
  if (error instanceof PublicApiError) {
    return { message: error.message, status: error.status };
  }

  return { message: fallback, status: 500 };
}

