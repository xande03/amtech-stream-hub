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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, config } = await req.json();

    switch (action) {
      case "get_config": {
        const { data, error } = await supabase
          .from("admin_config")
          .select("id, server_url, username, playlist_name, access_code, is_active, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        
        if (error && error.code !== "PGRST116") {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        return new Response(JSON.stringify({ config: data || null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      case "save_config": {
        if (!config?.server_url || !config?.username || !config?.password || !config?.access_code) {
          return new Response(JSON.stringify({ error: "Campos obrigatórios faltando" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        await supabase
          .from("admin_config")
          .update({ is_active: false })
          .eq("is_active", true);

        const { data, error } = await supabase
          .from("admin_config")
          .insert({
            server_url: config.server_url,
            username: config.username,
            password: config.password,
            playlist_name: config.playlist_name || "Principal",
            access_code: config.access_code,
            is_active: true,
          })
          .select("id, server_url, username, playlist_name, access_code, is_active")
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        return new Response(JSON.stringify({ config: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Ação inválida" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
