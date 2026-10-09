/**
 * Cliente HTTP mínimo para a REST API do Redmine.
 * Documentação: https://www.redmine.org/projects/redmine/wiki/Rest_api
 */

export function createClient({ baseUrl, apiKey, readOnly = false }) {
  if (!baseUrl || !apiKey) {
    throw new Error("REDMINE_URL e REDMINE_API_KEY são obrigatórios");
  }
  const root = baseUrl.replace(/\/$/, "");

  async function request(method, path, body) {
    if (readOnly && method !== "GET") {
      throw new Error("Modo somente leitura: operação de escrita bloqueada");
    }
    const url = `${root}${path.startsWith("/") ? path : `/${path}`}`;
    const headers = {
      "X-Redmine-API-Key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      const msg =
        data?.errors?.join?.("; ") ||
        data?.error ||
        text ||
        res.statusText;
      throw new Error(`Redmine ${res.status}: ${msg}`);
    }
    return data;
  }

  return {
    get: (path) => request("GET", path),
    post: (path, body) => request("POST", path, body),
    put: (path, body) => request("PUT", path, body),
    del: (path) => request("DELETE", path),
    root,
  };
}

export function qs(params = {}) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
