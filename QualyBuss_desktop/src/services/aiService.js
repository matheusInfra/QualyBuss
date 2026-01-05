import { supabase } from './supabase';

/**
 * Envia uma mensagem para o assistente de IA via Supabase Edge Function.
 * @param {string} message - A mensagem do usuário.
 * @returns {Promise<string>} - A resposta da IA.
 */
export const sendMessageToAI = async (message) => {
    try {
        // Redireciona para o nosso servidor Node.js Self-Hosted (server-chat.js)
        // Em produção, substitua 'http://localhost:3001' pelo IP do seu servidor
        const response = await fetch('http://localhost:3001/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error(`Erro no servidor: ${response.statusText}`);
        }

        const data = await response.json();
        return data.text;

    } catch (error) {
        console.error('Erro ao comunicar com IA:', error);
        return "Desculpe, não consegui conectar ao servidor de IA (Self-Hosted). Verifique se o 'server-chat.js' está rodando.";
    }
};

/**
 * Analisa uma imagem para extração de dados (OCR).
 * @param {File|Blob} imageFile - O arquivo de imagem.
 * @returns {Promise<Object>} - Dados extraídos (JSON).
 */
export const analyzeDocumentImage = async (imageFile) => {
    // TODO: Converter imagem para Base64 para envio
    // Por enquanto, apenas placeholder para a estrutura
    return { error: "Função de envio de imagem ainda em desenvolvimento." };
};
