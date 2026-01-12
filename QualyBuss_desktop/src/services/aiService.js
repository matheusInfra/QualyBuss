import { supabase } from './supabase';

const GEMINI_CHAT_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-chat`;

const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

/**
 * Envia mensagem e recebe resposta via Stream.
 * @param {string} message 
 * @param {File} file 
 * @param {function} onStreamUpdate - Função chamada a cada pedaço de texto recebido (chunk)
 * @returns {Promise<string>} O texto completo final.
 */
export const sendMessageToAI = async (message, file = null, onStreamUpdate = () => {}) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        let payload = { message };
        if (file) {
            payload.file = {
                data: await fileToBase64(file),
                mimeType: file.type
            };
        }

        const response = await fetch(GEMINI_CHAT_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao comunicar com a IA');
        }

        // Leitura do Stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
            onStreamUpdate(chunk); // Atualiza a UI
        }

        return fullText;

    } catch (error) {
        console.error('AI Service Error:', error);
        throw error;
    }
};