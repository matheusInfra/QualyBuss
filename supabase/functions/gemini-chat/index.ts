import { createClient } from 'jsr:@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_AI_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!apiKey || !supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing environment variables');
    }

    // 1. Auth e Contexto do Usuário
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } },
    });

    const { data: { user } } = await supabaseClient.auth.getUser();

    // 2. Configurações (Apenas System Instruction é dinâmica agora)
    let systemInstruction = "Você é um assistente útil para o QualyBuss.";
    
    // CONFIGURAÇÃO FIXA DO MODELO (Solicitado: Gemini 2.5 Flash-Lite)
    const selectedModel = "gemini-2.5-flash-lite"; 

    if (user) {
      const settingsClient = supabaseServiceKey 
        ? createClient(supabaseUrl, supabaseServiceKey) 
        : supabaseClient;

      const { data: settings } = await settingsClient
        .from('ai_settings')
        .select('system_instruction') // Removemos 'model' da query pois não usaremos mais
        .eq('user_id', user.id)
        .maybeSingle();

      if (settings && settings.system_instruction) {
        systemInstruction = settings.system_instruction;
      }
    }

    // 3. Preparar requisição para o Google AI
    const { message, file } = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Inicializa Modelo
    const model = genAI.getGenerativeModel({ 
        model: selectedModel,
        systemInstruction: systemInstruction
    });

    const promptParts: any[] = [];
    if (file && file.data && file.mimeType) {
        promptParts.push({
            inlineData: { data: file.data, mimeType: file.mimeType }
        });
    }
    promptParts.push(message);

    // 4. Gerar Stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await model.generateContentStream(promptParts);
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(new TextEncoder().encode(chunkText));
            }
          }
          controller.close();
        } catch (err: any) {
            console.error(`Erro no modelo ${selectedModel}:`, err);
            // Tratamento de erro amigável no stream
            const errorMsg = `\n[Erro ao processar com ${selectedModel}. Detalhes: ${err.message || 'Falha desconhecida'}]`;
            controller.enqueue(new TextEncoder().encode(errorMsg));
            controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/plain; charset=utf-8', 
        'Transfer-Encoding': 'chunked' 
      },
    });

  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});