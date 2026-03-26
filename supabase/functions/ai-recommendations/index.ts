import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { history, favorites } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    const historyNames = (history || []).slice(0, 15).map((h: { name: string; type: string }) => `${h.name} (${h.type})`).join(", ");
    const favNames = (favorites || []).slice(0, 10).map((f: { name: string; type: string }) => `${f.name} (${f.type})`).join(", ");

    const userContext = [
      historyNames ? `Assistidos recentemente: ${historyNames}` : "",
      favNames ? `Favoritos: ${favNames}` : "",
    ].filter(Boolean).join("\n");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Você é o sistema de recomendação inteligente do Xerife Player, um app de streaming IPTV premium. Com base no histórico de visualização e favoritos do usuário, sugira filmes e séries que ele provavelmente vai adorar.

Regras:
- Retorne EXATAMENTE um JSON array com 6-8 recomendações
- Cada item deve ter: { "name": "Nome do Filme/Série", "type": "movie" ou "series", "year": 2024, "reason": "motivo curto e envolvente de 1 linha em português" }
- NÃO repita itens que o usuário já assistiu ou favoritou
- Diversifique os gêneros mas mantenha relevância com o gosto do usuário
- Priorize títulos populares e bem avaliados
- Se o usuário não tem histórico, sugira títulos clássicos e populares variados
- Responda APENAS o JSON array, sem texto adicional, sem markdown, sem backticks`
          },
          {
            role: "user",
            content: userContext || "Usuário novo sem histórico. Sugira títulos populares e variados de diferentes gêneros."
          }
        ],
        temperature: 0.8,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Groq API error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

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
