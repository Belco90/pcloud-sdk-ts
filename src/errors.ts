export class PcloudApiError extends Error {
  readonly result: number;
  readonly method: string;
  readonly params?: Readonly<Record<string, unknown>>;

  constructor(result: number, message: string, method: string, params?: Record<string, unknown>) {
    super(`pCloud API error on ${method} (${result}): ${message}`);
    this.name = "PcloudApiError";
    this.result = result;
    this.method = method;
    if (params !== undefined) this.params = params;
  }
}

export class PcloudNetworkError extends Error {
  readonly method: string;
  readonly status?: number;

  constructor(method: string, message: string, status?: number, cause?: unknown) {
    super(`pCloud network error on ${method}: ${message}`);
    this.name = "PcloudNetworkError";
    this.method = method;
    if (status !== undefined) this.status = status;
    if (cause !== undefined) this.cause = cause;
  }
}
