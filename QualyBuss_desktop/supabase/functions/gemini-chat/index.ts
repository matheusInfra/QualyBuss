import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // 1. Trata requisições OPTIONS (Pre-flight do CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Pega os dados enviados pelo Front
    const { message } = await req.json();

    // 3. Pega a API Key das variáveis de ambiente (Secrets)
    // O Supabase injeta automaticamente as variáveis definidas via `supabase secrets set`
    const apiKey = Deno.env.get('GOOGLE_AI_KEY');
    if (!apiKey) {
      console.error("GOOGLE_AI_KEY is missing");
      throw new Error('Chave GOOGLE_AI_KEY não configurada no servidor (Secrets).');
    }

    // 4. Chama o Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    // Usando modelo flash que é rápido e eficiente
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini response success");

    // 5. Retorna a resposta
    return new Response(
      JSON.stringify({ text }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in gemini-chat:", error);
    
    // Retorna detalhes do erro para ajudar no debug do front
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro desconhecido no servidor",
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});