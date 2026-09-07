export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
    public path?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
