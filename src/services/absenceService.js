import { supabase } from './supabase';

export const absenceService = {
    // Get all collaborators with their calculated balance from the view
    async getCollaboratorsWithBalance({ page = 1, limit = 30, searchTerm = '' }) {
        try {
            let query = supabase
                .from('view_collaborator_balances')
                .select('*', { count: 'exact' });

            if (searchTerm) {
                query = query.or(`full_name.ilike.%${searchTerm}%,role.ilike.%${searchTerm}%`);
            }

            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, count, error } = await query
                .range(from, to)
                .order('full_name', { ascending: true });

            if (error) throw error;

            return { data, count };
        } catch (error) {
            console.error('Error fetching balances:', error);
            throw error;
        }
    },

    // Get transaction history for a specific collaborator
    async getHistory(collaboratorId) {
        try {
            const { data, error } = await supabase
                .from('absence_transactions')
                .select('*')
                .eq('collaborator_id', collaboratorId)
                .order('effective_date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching history:', error);
            throw error;
        }
    },

    // Create a new Credit/Debit transaction
    async addTransaction({ collaboratorId, type, quantity, category, reason, date }) {
        try {
            const { data, error } = await supabase
                .from('absence_transactions')
                .insert([
                    {
                        collaborator_id: collaboratorId,
                        type, // 'CREDIT' or 'DEBIT'
                        quantity,
                        category,
                        reason,
                        effective_date: date
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding transaction:', error);
            throw error;
        }
    }
};
