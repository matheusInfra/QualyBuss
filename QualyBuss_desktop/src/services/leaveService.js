import { supabase } from './supabase';

export const leaveService = {
    async getRequests({ month, year, collaboratorId } = {}) {
        let query = supabase
            .from('leave_requests')
            .select(`
                *,
                collaborators ( full_name, avatar_url, role )
            `)
            .order('start_date', { ascending: true });

        // Filter by month overlap if needed, but for now fetching all for the year is safer for calendar
        // Or specific collaborator history
        if (collaboratorId) {
            query = query.eq('collaborator_id', collaboratorId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
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
