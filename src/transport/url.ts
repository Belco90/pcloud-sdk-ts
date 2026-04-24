type Primitive = string | number | boolean;

export function buildUrl(
  apiServer: string,
  method: string,
  params?: Record<string, Primitive | undefined>,
): string {
  const url = new URL(`https://${apiServer}/${method}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}
