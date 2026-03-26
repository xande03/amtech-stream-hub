import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { history, favorites } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const historyNames = (history || []).slice(0, 15).map((h: { name: string; type: string }) => `${h.name} (${h.type})`).join(", ");
    const favNames = (favorites || []).slice(0, 10).map((f: { name: string; type: string }) => `${f.name} (${f.type})`).join(", ");

    const userContext = [
      historyNames ? `Assistidos recentemente: ${historyNames}` : "",
      favNames ? `Favoritos: ${favNames}` : "",
    ].filter(Boolean).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é o sistema de recomendação do Xerife Player. Com base no histórico e favoritos do usuário, sugira filmes e séries que ele provavelmente vai gostar.

Regras:
- Retorne EXATAMENTE um JSON array com 6-10 recomendações
- Cada item: { "name": "Nome do Filme/Série", "type": "movie" ou "series", "year": 2024, "reason": "motivo curto de 1 linha" }
- NÃO repita itens já assistidos ou favoritados
- Diversifique gêneros mas mantenha relevância
- Responda APENAS o JSON array, sem texto adicional`
          },
          {
            role: "user",
            content: userContext || "Usuário novo sem histórico. Sugira títulos populares e variados."
          }
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Extract JSON array from response
    let recommendations = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.error("Failed to parse recommendations:", err);
    }

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const err = e as Error;
    console.error("ai-recommendations error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
