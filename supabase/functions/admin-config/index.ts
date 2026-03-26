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

    const { action, config, id, admin_password } = await req.json();

    const protectedActions = ["save_config", "toggle_config", "delete_config", "update_config"];
    if (protectedActions.includes(action)) {
      const adminPw = Deno.env.get("ADMIN_SECRET") || "abcd123";
      if (admin_password !== adminPw) {
        return new Response(JSON.stringify({ error: "Senha de administrador inválida" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    switch (action) {
      case "get_active_config": {
        const { data } = await supabase
          .from("admin_config")
          .select("id, server_url, username, playlist_name, access_code, is_active")
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return new Response(JSON.stringify({ config: data || null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      case "get_config": {
        const { data } = await supabase
          .from("admin_config")
          .select("id, server_url, username, playlist_name, access_code, is_active, created_at, updated_at")
          .order("created_at", { ascending: false });

        return new Response(JSON.stringify({ configs: data || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      case "save_config": {
        if (!config?.server_url || !config?.username || !config?.password || !config?.access_code) {
          return new Response(JSON.stringify({ error: "Campos obrigatórios faltando" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        if (config.is_active !== false) {
          await supabase.from("admin_config").update({ is_active: false }).eq("is_active", true);
        }

        const { data, error } = await supabase
          .from("admin_config")
          .insert({
            server_url: config.server_url,
            username: config.username,
            password: config.password,
            playlist_name: config.playlist_name || "Principal",
            access_code: config.access_code,
            is_active: config.is_active !== false,
          })
          .select("id, server_url, username, playlist_name, access_code, is_active, created_at")
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

      // NEW: update existing playlist
      case "update_config": {
        if (!id) {
          return new Response(JSON.stringify({ error: "ID é obrigatório" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const updateData: Record<string, any> = {};
        if (config?.server_url) updateData.server_url = config.server_url;
        if (config?.username) updateData.username = config.username;
        if (config?.password) updateData.password = config.password;
        if (config?.playlist_name) updateData.playlist_name = config.playlist_name;
        if (config?.access_code) updateData.access_code = config.access_code;

        if (Object.keys(updateData).length === 0) {
          return new Response(JSON.stringify({ error: "Nenhum campo para atualizar" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const { data, error } = await supabase
          .from("admin_config")
          .update(updateData)
          .eq("id", id)
          .select("id, server_url, username, playlist_name, access_code, is_active, created_at")
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

      case "toggle_config": {
        if (!id) {
          return new Response(JSON.stringify({ error: "ID é obrigatório" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const { data: current } = await supabase
          .from("admin_config")
          .select("is_active")
          .eq("id", id)
          .single();

        const newState = !current?.is_active;

        if (newState) {
          await supabase.from("admin_config").update({ is_active: false }).eq("is_active", true);
        }

        const { data, error } = await supabase
          .from("admin_config")
          .update({ is_active: newState })
          .eq("id", id)
          .select("id, is_active")
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

      case "delete_config": {
        if (!id) {
          return new Response(JSON.stringify({ error: "ID é obrigatório" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const { error } = await supabase.from("admin_config").delete().eq("id", id);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        return new Response(JSON.stringify({ success: true }), {
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
      JSON.stringify({ error: (err as Error).message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
