import { supabase } from './supabase';

const GEMINI_CHAT_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-chat`;

/**
 * Converts a File object to a Base64 string.
 * @param {File} file 
 * @returns {Promise<string>} Base64 string
 */
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
};

/**
 * Sends a message (and optional file) to the AI service.
 * @param {string} message - The user's text message.
 * @param {File} [file] - Optional file to attach.
 * @returns {Promise<string>} The AI's response text.
 */
export const sendMessageToAI = async (message, file = null) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        let payload = { message };

        if (file) {
            try {
                const base64Data = await fileToBase64(file);
                payload.file = {
                    data: base64Data,
                    mimeType: file.type
                };
            } catch (fileError) {
                console.error("Error converting file:", fileError);
                throw new Error("Failed to process file.");
            }
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

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('AI Service Error:', error);
        throw error;
    }
};