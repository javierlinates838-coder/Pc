import {
  getEbayApiBase,
  getEbayClientId,
  getEbayClientSecret,
  isEbayConfigured,
} from "./config";

const OAUTH_SCOPE = "https://api.ebay.com/oauth/api_scope";

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

export async function getEbayAccessToken(): Promise<string> {
  if (!isEbayConfigured()) {
    throw new Error("eBay API credentials are not configured");
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.accessToken;
  }

  const clientId = getEbayClientId()!;
  const clientSecret = getEbayClientSecret()!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch(
    `${getEbayApiBase()}/identity/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: OAUTH_SCOPE,
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`eBay OAuth failed (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return cachedToken.accessToken;
}

export function clearEbayTokenCache(): void {
  cachedToken = null;
}
