import { apiRequest } from "./transport/request";
import { assert } from "./util/assert";

interface OAuthTokenOptions {
  clientId: string;
  redirectUri: string;
  responseType?: "token" | "code";
  receiveToken: (token: string, locationid: string | null) => void;
}

interface OAuthPollOptions {
  clientId: string;
  receiveToken: (token: string, locationid: number) => void;
  onError: (err: Error) => void;
}

declare global {
  interface Window {
    __setPcloudToken?: (token: string, locationid: string | null) => void;
  }
}

function buildAuthorizeUrl(query: Record<string, string>): string {
  const url = new URL("https://my.pcloud.com/oauth2/authorize");
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  return url.toString();
}

function randomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function initOauthToken(options: OAuthTokenOptions): void {
  assert(options.clientId, "`clientId` is required");
  assert(options.redirectUri, "`redirectUri` is required");
  assert(options.receiveToken, "`receiveToken` is required");

  const oauthUrl = buildAuthorizeUrl({
    client_id: options.clientId,
    redirect_uri: options.redirectUri,
    response_type: options.responseType ?? "token",
  });

  window.open(oauthUrl, "oauth", "width=680,height=700");

  window.__setPcloudToken = (token, locationid) => {
    options.receiveToken(token, locationid);
    delete window.__setPcloudToken;
  };
}

export function initOauthPollToken(options: OAuthPollOptions): void {
  assert(options.clientId, "`clientId` is required");
  assert(options.receiveToken, "`receiveToken` is required");
  assert(options.onError, "`onError` is required");

  const requestId = randomString(40);

  const oauthUrl = buildAuthorizeUrl({
    client_id: options.clientId,
    request_id: requestId,
    response_type: "poll_token",
  });

  window.open(oauthUrl, "", "width=680,height=700");

  const pollServer = (server: string): void => {
    void apiRequest<{ access_token: string; locationid: number }>(server, "oauth2_token", {
      params: { client_id: options.clientId, request_id: requestId },
    })
      .then((res) => options.receiveToken(res.access_token, res.locationid))
      .catch((err: unknown) =>
        options.onError(err instanceof Error ? err : new Error(String(err))),
      );
  };

  pollServer("eapi.pcloud.com");
  pollServer("api.pcloud.com");
}

export function popup(): void {
  const matchToken = location.hash.match(/access_token=([^&]+)/);
  const matchCode = location.search.match(/code=([^&]+)/);
  const locationIdMatch = location.hash.match(/locationid=([^&]+)/);
  const locationid = locationIdMatch?.[1] ?? null;
  const token = matchToken?.[1] ?? matchCode?.[1] ?? null;

  if (token && window.opener?.__setPcloudToken) {
    window.opener.__setPcloudToken(token, locationid);
    window.close();
  }
}
