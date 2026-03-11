/**
 * Qonto API client with Basic auth (login:secret_key).
 * Base URL: https://thirdparty.qonto.com
 */

const QONTO_BASE_URL = "https://thirdparty.qonto.com";

export interface QontoClientConfig {
  login: string;
  secretKey: string;
}

/**
 * Builds Authorization header for Qonto API.
 * Format: raw "login:secret_key" (NOT Base64 encoded).
 * @see https://docs.qonto.com/get-started/business-api/authentication/api-key
 */
function getAuthHeader(login: string, secretKey: string): string {
  return `${login}:${secretKey}`;
}

/**
 * Fetches a Qonto API endpoint with auth.
 */
export async function qontoFetch<T>(
  path: string,
  config: QontoClientConfig,
  init?: RequestInit
): Promise<T> {
  const url = `${QONTO_BASE_URL}${path}`;
  const auth = getAuthHeader(config.login, config.secretKey);

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Qonto API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}
