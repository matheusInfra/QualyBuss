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
                .from('view_absence_history')
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
            let targetTable = 'absence_transactions';
            let cleanCategory = category;

            if (category?.startsWith('[FÉRIAS]')) {
                targetTable = 'vacation_transactions';
                cleanCategory = category.replace('[FÉRIAS] ', '');
            } else if (category?.startsWith('[EXTRAS]')) {
                targetTable = 'extra_days_transactions';
                cleanCategory = category.replace('[EXTRAS] ', '');
            }

            const { data, error } = await supabase
                .from(targetTable)
                .insert([
                    {
                        collaborator_id: collaboratorId,
                        type, // 'CREDIT' or 'DEBIT'
                        quantity,
                        category: cleanCategory,
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
