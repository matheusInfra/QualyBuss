import { supabase } from './supabase';

export const chatService = {
    /**
     * Creates a new chat session
     * @param {string} title - The title of the conversation (usually first message snippet)
     * @param {string} userId - The ID of the authenticated user
     * @returns {Promise<object>} The created session object
     */
    async createSession(title, userId) {
        const { data, error } = await supabase
            .from('chat_sessions')
            .insert([{ user_id: userId, title }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Saves a message to the database
     * @param {string} sessionId - The ID of the session
     * @param {'user' | 'bot'} role - Who sent the message
     * @param {string} content - The message content
     * @returns {Promise<object>} The created message object
     */
    async saveMessage(sessionId, role, content) {
        const { data, error } = await supabase
            .from('chat_messages')
            .insert([{ session_id: sessionId, role, content }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Fetches all chat sessions for a user (History)
     * @returns {Promise<Array>} List of sessions
     */
    async getSessions() {
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Fetches all messages for a specific session
     * @param {string} sessionId 
     * @returns {Promise<Array>} List of messages
     */
    async getMessages(sessionId) {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Deletes a session and its messages
     * @param {string} sessionId 
     */
    async deleteSession(sessionId) {
        const { error } = await supabase
            .from('chat_sessions')
            .delete()
            .eq('id', sessionId);

        if (error) throw error;
    },

    /**
     * Updates the title of a session (optional, e.g. after AI generates a summary)
     * @param {string} sessionId 
     * @param {string} title 
     */
    async updateSessionTitle(sessionId, title) {
        const { error } = await supabase
            .from('chat_sessions')
            .update({ title, updated_at: new Date() })
            .eq('id', sessionId);

        if (error) throw error;
    }
};
