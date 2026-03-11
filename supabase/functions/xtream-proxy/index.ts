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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let params: Record<string, any>;
    
    if (req.method === "GET") {
      // Support GET for stream proxy (used as video src)
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
    
    // Normalize server_url: add http:// if no protocol, handle provider-style names
    let normalizedUrl = server_url.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      // If it looks like a domain (has dots or colon for port), add http://
      normalizedUrl = `http://${normalizedUrl}`;
    }
    const base = normalizedUrl;

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
        const proxyOrigin = new URL(req.url).origin;

        const toProxyUrl = (uri: string) => {
          const absolute = new URL(uri, upstreamUrl).toString();
          return `${proxyOrigin}/functions/v1/xtream-proxy?action=proxy_stream&access_code=${encodeURIComponent(access_code)}&source_url=${encodeURIComponent(absolute)}`;
        };

        const rewritten = playlist
          .split("\n")
          .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return line;

            // Rewrite key URIs: #EXT-X-KEY:...URI="..."
            if (trimmed.startsWith("#")) {
              return line.replace(/URI="([^"]+)"/g, (_match, uri) => {
                try {
                  return `URI="${toProxyUrl(uri)}"`;
                } catch {
                  return _match;
                }
              });
            }

            // Rewrite media segment / child playlist lines
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

    // Handle stream URL request - return HTTPS URL to avoid mixed content
    if (action === "get_stream_url") {
      const ext = extension || (stream_type === "live" ? "m3u8" : "mp4");
      let url = buildStreamUrl(stream_type, stream_id, ext);
      // Force HTTPS to avoid mixed content on HTTPS pages
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
