import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// Removing SDK to avoid version hell and 500/404 errors. Using native fetch.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, file } = await req.json()
    const apiKey = Deno.env.get('GOOGLE_AI_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!apiKey || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables')
    }

    // 1. Authenticate User (Standard Client)
    const authHeader = req.headers.get('Authorization')
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    console.log("Edge Function Auth User:", user?.id || "None");

    let systemInstruction = "You are a helpful assistant for QualyBuss.";
    let selectedModel = "gemini-1.5-flash"; 

    // 2. Fetch Settings (Admin Client)
    if (user) {
        let settingsClient = supabaseClient;
        if (supabaseServiceRoleKey) {
            settingsClient = createClient(supabaseUrl, supabaseServiceRoleKey);
        }
        
        const { data: settings } = await settingsClient
            .from('ai_settings')
            .select('system_instruction, model')
            .eq('user_id', user.id)
            .maybeSingle(); 
        
        if (settings) {
            if (settings.system_instruction) systemInstruction = settings.system_instruction;
            if (settings.model) selectedModel = settings.model;
        }
    }

    // 3. Construct Gemini REST API Payload
    // Docs: https://ai.google.dev/api/rest/v1beta/models/generateContent
    
    // Construct request body
    const requestBody: any = {
        contents: [],
        system_instruction: {
            parts: [{ text: systemInstruction }]
        }
    };

    // User Message Content
    let userContentParts = [];
    
    if (file && file.data && file.mimeType) {
        userContentParts.push({
            inline_data: {
                mime_type: file.mimeType,
                data: file.data
            }
        });
    }
    
    // Always add text
    userContentParts.push({ text: message });

    requestBody.contents.push({
        role: "user",
        parts: userContentParts
    });

    // 4. Call Gemini API via Fetch with Fallback
    const MAX_RETRIES = 2; // Try original + 2 fallbacks
    
    // Define fallback sequence: Selected -> Latest aliases -> Stable versions
    const modelCandidates = [
        selectedModel,
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash",
        "gemini-1.0-pro" // Last resort
    ];
    
    // Remove duplicates
    const uniqueModels = [...new Set(modelCandidates)];
    
    let text = "Desculpe, não consegui gerar uma resposta.";
    let lastError = null;
    let success = false;

    for (const modelName of uniqueModels) {
        try {
            console.log(`Attempting Gemini API with model: ${modelName}`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

            const aiResponse = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const aiData = await aiResponse.json();

            if (!aiResponse.ok) {
                // If 404 (Not Found) or 400 (Bad Request - maybe model doesn't support system_instruction?), continue to next
                console.warn(`Model ${modelName} failed: ${aiResponse.status}`, aiData);
                lastError = aiData;
                
                // If 429 (Quota), stop immediately. No point retrying.
                if (aiResponse.status === 429) {
                     throw new Error("Quota Exceeded (429). Please change model or wait.");
                }
                
                continue; // Try next model
            }

            // Success!
            text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || text;
            success = true;
            console.log(`Success with model: ${modelName}`);
            break; // Stop loop

        } catch (err) {
            console.error(`Error with model ${modelName}:`, err);
            lastError = err;
            if (err.message.includes("Quota")) throw err; // Re-throw quota errors
        }
    }

    if (!success) {
        throw new Error(lastError?.error?.message || lastError?.message || "Failed to generate content with all available models.");
    }

    return new Response(
      JSON.stringify({ response: text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
