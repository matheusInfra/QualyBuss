import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message } = await req.json()
    const apiKey = Deno.env.get('GOOGLE_AI_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!apiKey || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables')
    }

    // Initialize Supabase Client to fetch settings
    // We need to use the authorization header from the request to respect RLS
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // Fetch User Settings (System Instruction)
    // We assume the user is authenticated, so auth.uid() will work in RLS
    const { data: { user } } = await supabase.auth.getUser()
    
    let systemInstruction = "You are a helpful assistant for QualyBuss.";
    
    if (user) {
        const { data: settings } = await supabase
            .from('ai_settings')
            .select('system_instruction')
            .eq('user_id', user.id)
            .single()
        
        if (settings && settings.system_instruction) {
            systemInstruction = settings.system_instruction;
        }
    }

    // Initialize Gemini with System Instruction
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction 
    })

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Hello" }],
        },
        {
          role: "model",
          parts: [{ text: "Hello! How can I help you today?" }],
        },
      ],
    })

    const result = await chat.sendMessage(message)
    const response = await result.response
    const text = response.text()

    return new Response(
      JSON.stringify({ response: text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})