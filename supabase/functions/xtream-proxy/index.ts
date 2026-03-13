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

// Common IPTV provider domain suffixes and ports to try
const PROVIDER_SUFFIXES = [
  // Most common IPTV patterns
  ".bar:8080", ".bar:80", ".bar:25461", ".bar:8880", ".bar",
  ".tv:8080", ".tv:80", ".tv:25461", ".tv:8880", ".tv",
  ".run:8080", ".run:80", ".run:25461", ".run",
  ".is:8080", ".is:80", ".is:25461", ".is",
  ".xyz:8080", ".xyz:80", ".xyz:25461", ".xyz",
  ".vip:8080", ".vip:80", ".vip:25461", ".vip",
  ".pro:8080", ".pro:80", ".pro:25461", ".pro",
  ".click:8080", ".click:80", ".click",
  ".online:8080", ".online:80", ".online",
  ".top:8080", ".top:80", ".top",
  ".net:8080", ".net:80", ".net:25461", ".net",
  ".com:8080", ".com:80", ".com:25461", ".com",
  ".me:8080", ".me:80", ".me",
  ".link:8080", ".link:80", ".link",
  ".io:8080", ".io:80", ".io",
  ".cc:8080", ".cc:80", ".cc",
  ".ws:8080", ".ws:80", ".ws",
  ".to:8080", ".to:80", ".to",
  ".in:8080", ".in:80", ".in",
  ".co:8080", ".co:80", ".co",
  ".site:8080", ".site:80", ".site",
  ".stream:8080", ".stream:80", ".stream",
  ".watch:8080", ".watch",
  ".live:8080", ".live",
  ".fun:8080", ".fun",
  ".club:8080", ".club",
  ".world:8080", ".world",
  ".one:8080", ".one",
  ".info:8080", ".info",
  ".org:8080", ".org",
];

// Check if the input looks like a full URL or domain (has dots, colons with port, or protocol)
function isFullUrl(input: string): boolean {
  return /^https?:\/\//i.test(input) || input.includes('.') || /:\d+/.test(input);
}

// Fetch with per-request timeout
async function fetchWithTimeout(url: string, timeoutMs: number, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const combinedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;
  try {
    return await fetch(url, { signal: combinedSignal, headers: { "Accept": "application/json" } });
  } finally {
    clearTimeout(timer);
  }
}

// Try to resolve a bare provider name to a working server URL
async function resolveProviderUrl(providerName: string, username: string, password: string): Promise<string | null> {
  const name = providerName.trim().toLowerCase().replace(/\/+$/, "");
  
  if (isFullUrl(name)) {
    let url = name;
    if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
    return url.replace(/\/+$/, "");
  }

  const globalController = new AbortController();
  const globalTimeout = setTimeout(() => globalController.abort(), 20000);

  try {
    const result = await Promise.any(
      PROVIDER_SUFFIXES.map(async (suffix) => {
        const baseUrl = `http://${name}${suffix}`;
        const testUrl = `${baseUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
        try {
          const res = await fetchWithTimeout(testUrl, 8000, globalController.signal);
          if (res.ok) {
            const text = await res.text();
            const json = JSON.parse(text);
            if (json.user_info || json.server_info || Array.isArray(json)) {
              return baseUrl;
            }
          }
        } catch {
          // skip
        }
        throw new Error("not found");
      })
    );
    clearTimeout(globalTimeout);
    return result;
  } catch {
    // All attempts failed
    clearTimeout(globalTimeout);
    return null;
  }
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

    // Direct connection test (no access code needed - used before saving)
    if (action === "test_connection") {
      const { server_url: testServer, username: testUser, password: testPass } = params;
      if (!testServer || !testUser || !testPass) {
        return new Response(
          JSON.stringify({ error: "Servidor, usuário e senha são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let resolvedUrl: string | null;
      if (isFullUrl(testServer)) {
        let u = testServer.trim().replace(/\/+$/, "");
        if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
        resolvedUrl = u;
      } else {
        resolvedUrl = await resolveProviderUrl(testServer, testUser, testPass);
      }

      if (!resolvedUrl) {
        return new Response(
          JSON.stringify({ error: `Não foi possível resolver o provedor "${testServer}". Tente a URL completa.` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const testUrl = `${resolvedUrl}/player_api.php?username=${encodeURIComponent(testUser)}&password=${encodeURIComponent(testPass)}`;
        const res = await fetch(testUrl);
        if (!res.ok) {
          return new Response(
            JSON.stringify({ error: `Servidor respondeu com erro (${res.status})` }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const data = await res.json();
        return new Response(
          JSON.stringify({ 
            success: true, 
            resolved_url: resolvedUrl,
            user_info: data.user_info || null,
            server_info: data.server_info || null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: `Falha ao conectar: ${err.message}` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

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

    // Handle stream proxy request (binary passthrough + playlist rewrite + VOD chunked)
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

      let upstreamUrl = sourceUrl || buildStreamUrl(stream_type, stream_id, ext);
      const isVod = stream_type === "movie" || stream_type === "series";
      const isHlsContent = ext === "m3u8" || upstreamUrl.includes(".m3u8");

      // --- VOD chunked proxy (MP4/MKV) ---
      // Stream bytes through the edge function to avoid mixed-content blocking.
      // The browser sends Range headers automatically; we forward them upstream.
      if (isVod && !isHlsContent) {
        const upstreamHeaders = new Headers({
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        });
        const rangeHeader = req.headers.get("range");
        if (rangeHeader) {
          upstreamHeaders.set("Range", rangeHeader);
        }

        let upstreamRes: Response;
        try {
          upstreamRes = await fetch(upstreamUrl, { headers: upstreamHeaders, redirect: "follow" });
        } catch {
          // Try alternate protocol
          const altUrl = upstreamUrl.startsWith("https://")
            ? upstreamUrl.replace(/^https:\/\//, "http://")
            : upstreamUrl.replace(/^http:\/\//, "https://");
          upstreamRes = await fetch(altUrl, { headers: upstreamHeaders, redirect: "follow" });
        }

        if (!upstreamRes.ok && upstreamRes.status !== 206) {
          return new Response(
            JSON.stringify({ error: `Erro no proxy VOD (${upstreamRes.status})` }),
            { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const respHeaders = new Headers(corsHeaders);
        const ct = upstreamRes.headers.get("content-type") || "video/mp4";
        respHeaders.set("Content-Type", ct);
        respHeaders.set("Accept-Ranges", "bytes");
        ["content-range", "content-length", "etag", "last-modified"].forEach((h) => {
          const v = upstreamRes.headers.get(h);
          if (v) respHeaders.set(h, v);
        });
        respHeaders.set("Cache-Control", "public, max-age=3600");

        return new Response(upstreamRes.body, {
          status: upstreamRes.status,
          headers: respHeaders,
        });
      }

      // --- Live / HLS proxy (existing logic) ---
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

    // Check multiple channels online status
    if (action === "check_channels") {
      const streamIds: number[] = params.stream_ids || [];
      console.log(`check_channels: checking ${streamIds.length} channels`);
      if (!streamIds.length) {
        return new Response(JSON.stringify({ results: {} }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check up to 50 channels in parallel with HEAD requests
      const idsToCheck = streamIds.slice(0, 50);
      const results: Record<number, boolean> = {};

      await Promise.allSettled(
        idsToCheck.map(async (id) => {
          const url = `${base}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${id}.m3u8`;
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(url, { 
              method: "HEAD", 
              signal: controller.signal,
              redirect: "follow",
            });
            clearTimeout(timer);
            results[id] = res.ok || res.status === 302 || res.status === 206;
          } catch {
            results[id] = false;
          }
        })
      );

      console.log(`check_channels: done. Online: ${Object.values(results).filter(v => v).length}, Offline: ${Object.values(results).filter(v => !v).length}`);
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle stream URL request — returns the direct URL for the client
    if (action === "get_stream_url") {
      const ext = extension || (stream_type === "live" ? "m3u8" : "mp4");
      let url = buildStreamUrl(stream_type, stream_id, ext);
      // Force HTTPS for video URLs to avoid mixed-content blocking
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
