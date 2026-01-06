import { supabase } from './supabase';

export const movementService = {
    // List all movements with optional filters
    async getMovements({ status, collaboratorId } = {}) {
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
            `)
            .order('effective_date', { ascending: false });

        if (status) query = query.eq('status', status);
        if (collaboratorId) query = query.eq('collaborator_id', collaboratorId);

        const { data, error } = await query;
        if (error) throw error;
        return data;
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
