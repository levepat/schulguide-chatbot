export function readKeyFromHash(hash: string): string | null {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const key = params.get("key")?.trim();
  return key ? key : null;
}

export function buildShareUrl(origin: string, baseUrl: string, apiKey: string): string {
  return `${origin}${baseUrl}#key=${encodeURIComponent(apiKey)}`;
}

export function maskKey(apiKey: string): string {
  return `sk-ant-…${apiKey.slice(-4)}`;
}
