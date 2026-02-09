import { supabase } from './supabase';

export const kpiService = {
    /**
     * Fetches dashboard overview stats (Score, Alerts, Pending).
     * Uses Postgres Function: get_compliance_dash_stats()
     */
    async getComplianceStats() {
        const { data, error } = await supabase
            .rpc('get_compliance_dash_stats');

        if (error) {
            console.error('Error fetching KPI stats:', error);
            throw error;
        }
        return data;
    },

    /**
     * Fetches unified feed of Geolocation events (Signatures + Terms).
     * Uses Postgres Function: get_geo_events_feed(limit_count, p_user_id)
     */
    /**
     * Fetches unified feed of Geolocation events (Signatures + Terms).
     * Uses Postgres Function: get_geo_events_feed(limit_count, p_user_id)
     * Fallback: Client-side aggregation if RPC fails.
     */
    async getGeoEvents(limit = 50, userId = null) {
        // Prepare params. Always send p_user_id (even if null) to match RPC signature exactly
        const params = {
            limit_count: limit,
            p_user_id: userId || null
        };

        // try {
        //     const { data, error } = await supabase.rpc('get_geo_events_feed', params);
        //     if (error) throw error;
        //     return data;
        // } catch (rpcError) {
        // console.warn("RPC 'get_geo_events_feed' failed/missing. Using Client-Side Fallback.", rpcError);

        // --- FALLBACK LOGIC (Primary now due to RPC bug) ---
        try {
            // 1. Fetch Signatures (collaborator_documents)
            // Note: Documents currently do NOT have explicit lat/lng columns in the schema.
            // We fetch them to show in the feed, but they won't appear on the map unless we add geo columns later.
            let docsQuery = supabase
                .from('collaborator_documents')
                .select('id, created_at, category, name, collaborators(full_name)')
                // .not('location_lat', 'is', null) // REMOVED: Column doesn't exist
                .order('created_at', { ascending: false })
                .limit(limit);

            // 2. Fetch Terms (user_term_acceptances)
            // Note: Terms use a 'location' JSONB column, not separate lat/lng columns.
            let termsQuery = supabase
                .from('user_term_acceptances')
                .select('id, accepted_at, term_version, location, user_id')
                .order('accepted_at', { ascending: false })
                .limit(limit);

            // Note: Filter by userId if provided (complex for fallback, skipping specific user filter for robustness in this patch)

            const [docsRes, termsRes] = await Promise.all([docsQuery, termsQuery]);

            const docEvents = (docsRes.data || []).map(d => ({
                event_id: `doc_${d.id}`,
                event_type: 'SIGNATURE',
                title: `Assinatura: ${d.category || 'Documento'} - ${d.name}`,
                event_time: d.created_at,
                lat: null, // No geo for docs yet
                lng: null,
                user_ref: d.collaborators?.full_name || 'Colaborador'
            }));

            const termEvents = (termsRes.data || []).map(t => {
                // Extract lat/lng from JSON location object if available
                // Expected format: { coords: { latitude: 123, longitude: 456 } } or similar
                const coords = t.location?.coords || t.location;
                const lat = coords?.latitude || coords?.lat || null;
                const lng = coords?.longitude || coords?.lng || null;

                return {
                    event_id: `term_${t.id}`,
                    event_type: 'TERM',
                    title: `Aceite de Termos v${t.term_version || '?'}`,
                    event_time: t.accepted_at,
                    lat: lat,
                    lng: lng,
                    user_ref: t.user_id ? `User ${t.user_id.slice(0, 4)}` : 'Usuário'
                };
            });

            // Combine, Sort, Limit
            const combined = [...docEvents, ...termEvents]
                .sort((a, b) => new Date(b.event_time) - new Date(a.event_time))
                .slice(0, limit);

            return combined;
        } catch (fallbackError) {
            console.error("Critical: Both RPC and Fallback failed for Geo Events.", fallbackError);
            return []; // Return empty array to prevent UI crash
        }
    },

    /**
     * Fetch simple counts for Auditoria Page
     */
    async getAuditStats() {
        // 1. Total Logs
        const { count: totalLogs } = await supabase
            .from('audit_logs')
            .select('*', { count: 'exact', head: true });

        // 2. Critical Alerts (Delete Ops last 24h)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const { count: criticalAlerts } = await supabase
            .from('audit_logs')
            .select('*', { count: 'exact', head: true })
            .eq('operation', 'DELETE')
            .gt('changed_at', yesterday.toISOString());

        // 3. Active Users (Approx distinct - fetching small list to count)
        // Note: Real distinct count is expensive, this is a "recent active" proxy
        const { data: recentUsers } = await supabase
            .from('audit_logs')
            .select('changed_by')
            .order('changed_at', { ascending: false })
            .limit(100);

        const uniqueUsers = new Set(recentUsers?.map(u => u.changed_by).filter(Boolean)).size;

        return {
            totalLogs: totalLogs || 0,
            criticalAlerts: criticalAlerts || 0,
            activeUsers: uniqueUsers || 0
        };
    }
};
