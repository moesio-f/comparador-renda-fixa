export const FETCH_TIMEOUT_MS = 20_000;
const RETRY_DELAY_MS = 1_500;

async function fetchOnce(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.json();
}

/** GET with a timeout and one retry: the BCB API sometimes rejects a request that succeeds right after. */
export async function fetchJson(url: string): Promise<unknown> {
  try {
    return await fetchOnce(url);
  } catch {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    return fetchOnce(url);
  }
}
