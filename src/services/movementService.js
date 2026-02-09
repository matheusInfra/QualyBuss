import { supabase } from './supabase';

export const movementService = {
    // List all movements with optional filters
    // List all movements with optional filters
    async getMovements({ status, collaboratorId, page = 1, limit = 10 } = {}) {
        let query = supabase
            .from('job_movements')
            .select(`
                *,
                collaborators (
                    id,
                    full_name,
                    role,
                    avatar_url
                )
            `, { count: 'exact' })
            .order('effective_date', { ascending: false });

        if (status) query = query.eq('status', status);
        if (collaboratorId) query = query.eq('collaborator_id', collaboratorId);

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query.range(from, to);

        const { data, count, error } = await query;
        if (error) throw error;
        return { data, count };
    },

    // Create a new movement request
    async createMovement(movementData) {
        const { data, error } = await supabase
            .from('job_movements')
            .insert([movementData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update status (e.g., Approve, Complete)
    async updateStatus(id, status, approverId = null) {
        const payload = { status };
        if (approverId) payload.approver_id = approverId;

        const { data, error } = await supabase
            .from('job_movements')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete (Draft only usually)
    async deleteMovement(id) {
        const { error } = await supabase
            .from('job_movements')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
