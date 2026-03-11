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
    const body = await req.json();
    const { action, access_code, category_id, vod_id, series_id, stream_type, stream_id, extension } = body;

    const validation = await getCredentials(access_code);
    if (!validation) {
      return new Response(
        JSON.stringify({ error: "Código de acesso inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { server_url, username, password, playlist_name } = validation;
    const base = server_url.replace(/\/+$/, "");

    // Handle stream proxy - pipe the actual stream through this function
    if (action === "proxy_stream") {
      const ext = extension || (stream_type === "live" ? "ts" : "mp4");
      const pathType = stream_type === "movie" ? "movie" : stream_type === "series" ? "series" : "live";
      const streamUrl = `${base}/${pathType}/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${stream_id}.${ext}`;
      
      try {
        const streamRes = await fetch(streamUrl, {
          headers: { "User-Agent": "Mozilla/5.0" },
          redirect: "follow",
        });
        
        if (!streamRes.ok) {
          return new Response(
            JSON.stringify({ error: "Stream indisponível" }),
            { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const contentType = streamRes.headers.get("content-type") || "video/mp2t";
        
        return new Response(streamRes.body, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": contentType,
            "Cache-Control": "no-cache, no-store",
          },
        });
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "Erro ao conectar ao stream" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle stream URL request - return the URL directly (for m3u8 playlists)
    if (action === "get_stream_url") {
      const ext = extension || (stream_type === "live" ? "ts" : "mp4");
      const pathType = stream_type === "movie" ? "movie" : stream_type === "series" ? "series" : "live";
      const url = `${base}/${pathType}/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${stream_id}.${ext}`;
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
        apiUrl += `&action=get_short_epg&stream_id=${body.stream_id}&limit=${body.limit || 4}`; break;
      case "get_all_epg":
        apiUrl += `&action=get_simple_data_table&stream_id=${body.stream_id}`; break;
      default:
        return new Response(
          JSON.stringify({ error: "Ação inválida" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const apiRes = await fetch(apiUrl);
    if (!apiRes.ok) {
      return new Response(
        JSON.stringify({ error: "Erro ao consultar servidor IPTV" }),
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
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
