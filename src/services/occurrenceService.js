import { supabase } from './supabase';

export const occurrenceService = {
    // List all with optional filters and pagination
    async getAll({
        collaboratorId,
        page = 1,
        limit = 10,
        searchTerm = '',
        startDate,
        endDate,
        archived = false
    } = {}) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

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
            `, { count: 'exact' });

        // Filters
        if (collaboratorId) query = query.eq('collaborator_id', collaboratorId);

        if (archived) {
            query = query.not('archived_at', 'is', null);
        } else {
            query = query.is('archived_at', null); // Only show active by default
        }

        if (searchTerm) {
            // This assumes we have a text column to search or using OR logic on description/title
            query = query.ilike('title', `%${searchTerm}%`);
        }

        if (startDate) query = query.gte('date_event', startDate);
        if (endDate) query = query.lte('date_event', endDate);

        // Sorting
        query = query.order('date_event', { ascending: false }).range(from, to);

        const { data, error, count } = await query;
        if (error) throw error;
        return { data, count };
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

    // Update (Edit occurrence)
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

    // Soft Delete (Archive)
    async archive(id) {
        const { data, error } = await supabase
            .from('occurrences')
            .update({ archived_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Restore (Unarchive)
    async unarchive(id) {
        const { data, error } = await supabase
            .from('occurrences')
            .update({ archived_at: null })
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
