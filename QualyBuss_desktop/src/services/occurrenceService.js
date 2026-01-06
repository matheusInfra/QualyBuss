import { supabase } from './supabase';

export const occurrenceService = {
    // List all with optional filters
    async getAll({ collaboratorId } = {}) {
        let query = supabase
            .from('occurrences')
            .select(`
                *,
                collaborators (
                    id,
                    full_name,
                    role,
                    avatar_url
                ),
                collaborator_documents (
                    id,
                    name,
                    url
                )
            `)
            .order('date_event', { ascending: false });

        if (collaboratorId) query = query.eq('collaborator_id', collaboratorId);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // Create new occurrence
    async create(occurrenceData) {
        const { data, error } = await supabase
            .from('occurrences')
            .insert([occurrenceData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update (e.g., acknowledged status)
    async update(id, updates) {
        const { data, error } = await supabase
            .from('occurrences')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('occurrences')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
