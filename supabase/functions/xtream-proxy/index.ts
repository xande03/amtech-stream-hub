import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getCredentials(accessCode: string) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data, error } = await supabase.rpc("validate_access_code", { code: accessCode });
  if (error || !data?.valid) return null;
  return data;
}

// Common IPTV provider domain suffixes to try when a bare name is given
const PROVIDER_SUFFIXES = [
  ".bar:8080",
  ".tv:8080",
  ".bar:80",
  ".tv:80",
  ".bar:25461",
  ".tv:25461",
  ".bar",
  ".tv",
  ".xyz:8080",
  ".xyz:25461",
  ".xyz",
  ".vip:8080",
  ".vip:25461",
  ".vip",
  ".pro:8080",
  ".pro",
  ".click:8080",
  ".click",
  ".online:8080",
  ".online",
  ".top:8080",
  ".top",
];

// Check if the input looks like a full URL or domain (has dots, colons with port, or protocol)
function isFullUrl(input: string): boolean {
  return /^https?:\/\//i.test(input) || input.includes('.') || /:\d+/.test(input);
}

// Try to resolve a bare provider name to a working server URL
async function resolveProviderUrl(providerName: string, username: string, password: string): Promise<string | null> {
  const name = providerName.trim().toLowerCase().replace(/\/+$/, "");
  
  // If it already looks like a URL, just normalize it
  if (isFullUrl(name)) {
    let url = name;
    if (!/^https?:\/\//i.test(url)) {
      url = `http://${url}`;
    }
    return url.replace(/\/+$/, "");
  }

  // Try common provider URL patterns in parallel batches
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    // Try all suffixes concurrently - first successful one wins
    const attempts = PROVIDER_SUFFIXES.map(async (suffix) => {
      const baseUrl = `http://${name}${suffix}`;
      const testUrl = `${baseUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      try {
        const res = await fetch(testUrl, { 
          signal: controller.signal,
          headers: { "Accept": "application/json" },
        });
        if (res.ok) {
          const text = await res.text();
          // Verify it's a valid Xtream response (should contain user_info or be valid JSON)
          try {
            const json = JSON.parse(text);
            if (json.user_info || json.server_info || Array.isArray(json)) {
              return baseUrl;
            }
          } catch {
            // Not valid JSON, skip
          }
        }
      } catch {
        // Connection failed, skip
      }
      return null;
    });

    // Use Promise.any-like behavior: resolve with first non-null
    const results = await Promise.allSettled(attempts);
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        return result.value;
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let params: Record<string, any>;
    
    if (req.method === "GET") {
      const url = new URL(req.url);
      params = Object.fromEntries(url.searchParams.entries());
    } else {
      params = await req.json();
    }
    
    const { action, access_code, category_id, vod_id, series_id, stream_type, stream_id, extension } = params;

    const validation = await getCredentials(access_code);
    if (!validation) {
      return new Response(
        JSON.stringify({ error: "Código de acesso inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { server_url, username, password, playlist_name } = validation;
    
    // Resolve the server URL - handles both full URLs and bare provider names
    let base: string;
    if (isFullUrl(server_url)) {
      let normalizedUrl = server_url.trim().replace(/\/+$/, "");
      if (!/^https?:\/\//i.test(normalizedUrl)) {
        normalizedUrl = `http://${normalizedUrl}`;
      }
      base = normalizedUrl;
    } else {
      // Bare provider name - try to resolve it
      const resolved = await resolveProviderUrl(server_url, username, password);
      if (!resolved) {
        return new Response(
          JSON.stringify({ 
            error: `Não foi possível resolver o provedor "${server_url}". Tente usar a URL completa do servidor (ex: http://provedor.bar:8080).` 
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      base = resolved;
      console.log(`Resolved provider "${server_url}" to ${base}`);
    }

    const resolvePathType = (type: string) =>
      type === "movie" ? "movie" : type === "series" ? "series" : "live";

    const buildStreamUrl = (type: string, id: string | number, ext: string) => {
      const pathType = resolvePathType(type);
      return `${base}/${pathType}/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${id}.${ext}`;
    };

    const isAllowedSourceUrl = (sourceUrl: string) => {
      try {
        const src = new URL(sourceUrl);
        const baseHost = new URL(base).host;
        return src.host === baseHost;
      } catch {
        return false;
      }
    };

    // Handle stream proxy request (binary passthrough + playlist rewrite)
    if (action === "proxy_stream") {
      const sourceUrl = typeof params.source_url === "string" ? params.source_url : "";
      const ext = extension || (stream_type === "live" ? "m3u8" : "mp4");

      if (sourceUrl && !isAllowedSourceUrl(sourceUrl)) {
        return new Response(
          JSON.stringify({ error: "URL de origem inválida" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!sourceUrl && (!stream_type || !stream_id)) {
        return new Response(
          JSON.stringify({ error: "Parâmetros de stream inválidos" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const upstreamUrl = sourceUrl || buildStreamUrl(stream_type, stream_id, ext);
      const upstreamHeaders = new Headers();
      const range = req.headers.get("range");
      if (range) upstreamHeaders.set("range", range);

      const upstreamRes = await fetch(upstreamUrl, { headers: upstreamHeaders });
      if (!upstreamRes.ok && upstreamRes.status !== 206) {
        return new Response(
          JSON.stringify({ error: `Erro no proxy do stream (${upstreamRes.status})` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const contentType =
        upstreamRes.headers.get("content-type") ||
        (upstreamUrl.includes(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp2t");

      const headers = new Headers(corsHeaders);
      headers.set("Content-Type", contentType);
      ["cache-control", "accept-ranges", "content-range", "content-length", "etag", "last-modified"].forEach((h) => {
        const value = upstreamRes.headers.get(h);
        if (value) headers.set(h, value);
      });

      let body: BodyInit | ReadableStream<Uint8Array> | null = upstreamRes.body;

      // Rewrite playlist URIs to keep all chunks flowing through proxy (avoids mixed-content/CORS)
      if (contentType.includes("mpegurl") || upstreamUrl.includes(".m3u8")) {
        const playlist = await upstreamRes.text();
        const proxyHost = new URL(req.url).host;
        const proxyOrigin = `https://${proxyHost}`;

        const toProxyUrl = (uri: string) => {
          const absolute = new URL(uri, upstreamUrl).toString();
          return `${proxyOrigin}/functions/v1/xtream-proxy?action=proxy_stream&access_code=${encodeURIComponent(access_code)}&source_url=${encodeURIComponent(absolute)}`;
        };

        const rewritten = playlist
          .split("\n")
          .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return line;

            if (trimmed.startsWith("#")) {
              return line.replace(/URI="([^"]+)"/g, (_match, uri) => {
                try {
                  return `URI="${toProxyUrl(uri)}"`;
                } catch {
                  return _match;
                }
              });
            }

            try {
              return toProxyUrl(trimmed);
            } catch {
              return line;
            }
          })
          .join("\n");

        body = rewritten;
        headers.set("Content-Type", "application/vnd.apple.mpegurl");
        headers.delete("content-length");
      }

      return new Response(body, {
        status: upstreamRes.status,
        headers,
      });
    }

    // Handle stream URL request
    if (action === "get_stream_url") {
      const ext = extension || (stream_type === "live" ? "m3u8" : "mp4");
      let url = buildStreamUrl(stream_type, stream_id, ext);
      url = url.replace(/^http:\/\//, "https://");
      return new Response(
        JSON.stringify({ url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = `${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    let apiUrl = baseUrl;

    switch (action) {
      case "authenticate":
        break;
      case "get_live_categories":
        apiUrl += "&action=get_live_categories"; break;
      case "get_live_streams":
        apiUrl += "&action=get_live_streams";
        if (category_id) apiUrl += `&category_id=${category_id}`; break;
      case "get_vod_categories":
        apiUrl += "&action=get_vod_categories"; break;
      case "get_vod_streams":
        apiUrl += "&action=get_vod_streams";
        if (category_id) apiUrl += `&category_id=${category_id}`; break;
      case "get_series_categories":
        apiUrl += "&action=get_series_categories"; break;
      case "get_series":
        apiUrl += "&action=get_series";
        if (category_id) apiUrl += `&category_id=${category_id}`; break;
      case "get_series_info":
        apiUrl += `&action=get_series_info&series_id=${series_id}`; break;
      case "get_vod_info":
        apiUrl += `&action=get_vod_info&vod_id=${vod_id}`; break;
      case "get_short_epg":
        apiUrl += `&action=get_short_epg&stream_id=${params.stream_id}&limit=${params.limit || 4}`; break;
      case "get_all_epg":
        apiUrl += `&action=get_simple_data_table&stream_id=${params.stream_id}`; break;
      default:
        return new Response(
          JSON.stringify({ error: "Ação inválida" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    console.log(`Fetching: ${apiUrl.replace(/password=[^&]+/, 'password=***')}`);
    const apiRes = await fetch(apiUrl);
    if (!apiRes.ok) {
      const errText = await apiRes.text().catch(() => '');
      console.error(`API error ${apiRes.status}: ${errText.substring(0, 200)}`);
      return new Response(
        JSON.stringify({ error: `Erro ao consultar servidor IPTV (${apiRes.status}). Verifique a URL do servidor.` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await apiRes.json();

    if (action === "authenticate") {
      return new Response(
        JSON.stringify({
          user_info: data.user_info ? {
            username: data.user_info.username,
            status: data.user_info.status,
            exp_date: data.user_info.exp_date,
            max_connections: data.user_info.max_connections,
            active_cons: data.user_info.active_cons,
          } : null,
          server_info: data.server_info,
          playlist_name,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Proxy error:", err.message);
    const msg = err.message || "Erro interno";
    const isNetworkError = msg.includes("dns") || msg.includes("connect") || msg.includes("fetch");
    return new Response(
      JSON.stringify({ 
        error: isNetworkError 
          ? "Não foi possível conectar ao servidor. Verifique se a URL/provedor está correto (ex: http://servidor.com:8080)."
          : msg 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
