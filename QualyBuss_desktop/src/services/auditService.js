import { supabase } from './supabase';

export const auditService = {
    async getLogs({ page = 1, limit = 50, filters = {} }) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .order('changed_at', { ascending: false })
            .range(from, to);

        if (filters.tableName) {
            query = query.eq('table_name', filters.tableName);
        }
        if (filters.operation) {
            query = query.eq('operation', filters.operation);
        }

        const { data, count, error } = await query;
        if (error) throw error;

        return { data, count, totalPages: Math.ceil(count / limit) };
    }
};
