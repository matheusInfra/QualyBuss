import { supabase } from './supabase';

export const leaveService = {
    async getRequests({ month, year, collaboratorId, page = 1, limit = 10 } = {}) {
        let query = supabase
            .from('leave_requests')
            .select(`
                *,
                collaborators ( full_name, avatar_url, role )
            `, { count: 'exact' })
            .order('start_date', { ascending: false }); // Show newest first usually makes more sense for lists

        if (collaboratorId) {
            query = query.eq('collaborator_id', collaboratorId);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query.range(from, to);

        const { data, count, error } = await query;
        if (error) throw error;
        return { data, count };
    },

    async createRequest(requestData) {
        // requestData: { collaborator_id, start_date, end_date, type, days_count, status, reason }
        const { data, error } = await supabase
            .from('leave_requests')
            .insert([requestData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateStatus(id, status) {
        const { data, error } = await supabase
            .from('leave_requests')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateRequest(id, updates) {
        const { data, error } = await supabase
            .from('leave_requests')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
