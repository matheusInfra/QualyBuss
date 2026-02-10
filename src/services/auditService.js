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
        if (filters.search) {
            // Simple search on 'changed_by' (email/user) or 'table_name'
            // For JSONB search we would need text casting, creating index recommended for prod.
            // Using 'or' with ILIKE
            query = query.or(`changed_by.ilike.%${filters.search}%,table_name.ilike.%${filters.search}%`);
        }

        const { data, count, error } = await query;
        if (error) throw error;

        return { data, count, totalPages: Math.ceil(count / limit) };
    },

    // New: Fetch Critical Security Alerts (e.g. DELETEs in last X hours)
    async getSecurityAlerts(hours = 24) {
        const cutOff = new Date();
        cutOff.setHours(cutOff.getHours() - hours);

        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('operation', 'DELETE') // Focused on Destructive Actions
            .gt('changed_at', cutOff.toISOString())
            .order('changed_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
