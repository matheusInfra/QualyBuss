import { supabase } from './supabase';

export const sendMessageToAI = async (message, previousMessages = []) => {
    try {
        // Formata histórico se necessário para o Gemini (User/Model roles)
        // Isso melhora a "memória" que discutimos antes

        const { data, error } = await supabase.functions.invoke('gemini-chat', {
            body: {
                message,
                // Opcional: passar histórico simplificado se quiser memória
                // history: previousMessages 
            }
        });

        if (error) throw error;
        return data.text;

    } catch (error) {
        console.error('Erro ao comunicar com IA:', error);
        // Tenta logar o corpo da resposta se disponível no erro (depende da versão do client)
        if (error.context && error.context.json) {
            error.context.json().then(b => console.error('Detalhes do erro:', b));
        }
        return "Erro ao conectar com o assistente (Verifique o console para detalhes).";
    }
};