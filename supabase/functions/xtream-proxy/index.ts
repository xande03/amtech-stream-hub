import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, access_code, category_id, vod_id, series_id } = await req.json();

    // Validate access code and get credentials
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: validation, error: valError } = await supabase.rpc(
      "validate_access_code",
      { code: access_code }
    );

    if (valError || !validation?.valid) {
      return new Response(
        JSON.stringify({ error: "Código de acesso inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { server_url, username, password } = validation;
    const baseUrl = `${server_url.replace(/\/+$/, "")}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

    let apiUrl = baseUrl;

    switch (action) {
      case "authenticate":
        // Just validate, return server info without credentials
        break;
      case "get_live_categories":
        apiUrl += "&action=get_live_categories";
        break;
      case "get_live_streams":
        apiUrl += "&action=get_live_streams";
        if (category_id) apiUrl += `&category_id=${category_id}`;
        break;
      case "get_vod_categories":
        apiUrl += "&action=get_vod_categories";
        break;
      case "get_vod_streams":
        apiUrl += "&action=get_vod_streams";
        if (category_id) apiUrl += `&category_id=${category_id}`;
        break;
      case "get_series_categories":
        apiUrl += "&action=get_series_categories";
        break;
      case "get_series":
        apiUrl += "&action=get_series";
        if (category_id) apiUrl += `&category_id=${category_id}`;
        break;
      case "get_series_info":
        apiUrl += `&action=get_series_info&series_id=${series_id}`;
        break;
      case "get_vod_info":
        apiUrl += `&action=get_vod_info&vod_id=${vod_id}`;
        break;
      case "get_stream_url": {
        // Return the stream URL for the client to play
        const { stream_type, stream_id, extension } = await Promise.resolve({ 
          stream_type: (await req.clone().json()).stream_type,
          stream_id: (await req.clone().json()).stream_id,
          extension: (await req.clone().json()).extension
        }).catch(() => ({ stream_type: '', stream_id: '', extension: '' }));
        
        // We need to re-parse since we already consumed body
        // This case is handled below
        break;
      }
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

    // For authenticate, strip credentials from response
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
          playlist_name: validation.playlist_name,
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
