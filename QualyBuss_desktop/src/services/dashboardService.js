import { supabase } from './supabase';

export const dashboardService = {
    // Shared filters
    _getDates() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        const nextWeekStart = new Date(now);
        nextWeekStart.setDate(now.getDate() + 7);
        return { now, startOfMonth, endOfMonth, nextWeekStart };
    },

    // --- Granular Fetchers ---

    async fetchCollaboratorMetrics() {
        const { now } = this._getDates();

        // Parallel fetch for Active and Inactive
        const [activeRes, inactiveRes] = await Promise.all([
            supabase.from('collaborators')
                .select('id, full_name, role, department, salary, birth_date, admission_date, avatar_url')
                .eq('active', true),
            supabase.from('collaborators')
                .select('id', { count: 'exact', head: true })
                .eq('active', false)
        ]);

        const activeCollabs = activeRes.data || [];
        const inactiveCount = inactiveRes.count || 0;

        // Calculations
        const payroll = activeCollabs.reduce((sum, c) => sum + (Number(c.salary) || 0), 0);

        const currentMonth = now.getMonth();
        const birthdays = activeCollabs.filter(c => {
            if (!c.birth_date) return false;
            const parts = c.birth_date.split('-');
            if (parts.length < 3) return false;
            return (parseInt(parts[1]) - 1) === currentMonth;
        });

        const deptDist = activeCollabs.reduce((acc, c) => {
            const dept = c.department || 'Sem Departamento';
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
        }, {});

        // Tenure
        let totalTenureDays = 0;
        let tenureCount = 0;
        activeCollabs.forEach(c => {
            if (c.admission_date) {
                const admission = new Date(c.admission_date);
                const diffTime = Math.abs(now - admission);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                totalTenureDays += diffDays;
                tenureCount++;
            }
        });
        const avgTenureYears = tenureCount > 0 ? (totalTenureDays / tenureCount / 365).toFixed(1) : 0;

        // Turnover
        const totalDatabase = activeCollabs.length + inactiveCount;
        const turnoverRate = totalDatabase > 0 ? ((inactiveCount / totalDatabase) * 100).toFixed(1) : 0;

        return {
            activeCollaborators: activeCollabs.length,
            birthdays,
            payroll,
            deptDist,
            avgTenureYears,
            turnoverRate
        };
    },

    async fetchOccurrenceMetrics() {
        const { startOfMonth, endOfMonth } = this._getDates();

        const { data, error } = await supabase.from('occurrences')
            .select('id, type, created_at, date_event')
            .gte('date_event', startOfMonth)
            .lte('date_event', endOfMonth);

        const occurrences = data || [];

        const occurrencesByType = occurrences.reduce((acc, curr) => {
            acc[curr.type] = (acc[curr.type] || 0) + 1;
            return acc;
        }, {});

        return {
            occurrencesThisMonth: occurrences.length,
            occurrencesByType
        };
    },

    async fetchAbsenceMetrics() {
        const { now } = this._getDates();

        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const { data } = await supabase.from('leave_requests')
            .select('id, type, status, start_date, end_date')
            .in('status', ['APPROVED', 'PENDING']);

        const requests = data || [];

        const activeAbsences = requests.filter(l => {
            if (l.status === 'PENDING' && !['FALTA', 'ATESTADO'].includes(l.type)) return false;
            const start = new Date(l.start_date + 'T00:00:00');
            const end = new Date(l.end_date + 'T23:59:59');
            return now >= start && now <= end && l.type !== 'FERIAS';
        }).length;

        const activeVacations = requests.filter(l => {
            if (l.status !== 'APPROVED') return false;
            const start = new Date(l.start_date + 'T00:00:00');
            const end = new Date(l.end_date + 'T23:59:59');
            return now >= start && now <= end && l.type === 'FERIAS';
        }).length;

        const upcomingVacations = requests.filter(l => {
            // Future vacations (starts after today)
            if (l.status === 'PENDING') return false; // Usually only approved counts as 'scheduled'
            const start = new Date(l.start_date + 'T00:00:00');
            return start > today && l.type === 'FERIAS';
        }).length;

        return {
            activeAbsences,
            activeVacations,
            upcomingVacations
        };
    },

    async fetchMovementMetrics() {
        // Pending movements are straightforward count
        const { count } = await supabase.from('job_movements')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'PENDING');

        return {
            pendingMovements: count || 0
        };
    },

    // --- Main Initial Fetcher ---
    async getKPIs() {
        try {
            const [collab, occur, absence, move] = await Promise.all([
                this.fetchCollaboratorMetrics(),
                this.fetchOccurrenceMetrics(),
                this.fetchAbsenceMetrics(),
                this.fetchMovementMetrics()
            ]);

            return { ...collab, ...occur, ...absence, ...move };
        } catch (error) {
            console.error("Dashboard KPI Error:", error);
            return null;
        }
    },

    async getRecentActivity() {
        try {
            // Fetch recent items from different tables
            const [
                recentOccurrences,
                recentMovements
            ] = await Promise.all([
                supabase.from('occurrences')
                    .select('id, title, created_at, type, collaborators(full_name)')
                    .order('created_at', { ascending: false })
                    .limit(5),
                supabase.from('job_movements')
                    .select('id, type, created_at, status, collaborators(full_name)')
                    .order('created_at', { ascending: false })
                    .limit(5)
            ]);

            // Combine and sort
            const combined = [
                ...(recentOccurrences.data || []).map(i => ({ ...i, category: 'OCCURRENCE' })),
                ...(recentMovements.data || []).map(i => ({ ...i, category: 'MOVEMENT' }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5);

            return combined;
        } catch (error) {
            console.error("Dashboard Activity Error:", error);
            return [];
        }
    },

    // --- Realtime Subscription ---
    subscribeToChanges(onUpdate) {
        const channel = supabase.channel('dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'occurrences' }, async () => {
                const data = await this.fetchOccurrenceMetrics();
                onUpdate(data);
                // Also update recent activity
                const activity = await this.getRecentActivity();
                onUpdate({ recentActivity: activity }, true); // special flag if needed
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'collaborators' }, async () => {
                const data = await this.fetchCollaboratorMetrics();
                onUpdate(data);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, async () => {
                const data = await this.fetchAbsenceMetrics();
                onUpdate(data);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'job_movements' }, async () => {
                const data = await this.fetchMovementMetrics();
                onUpdate(data);
                const activity = await this.getRecentActivity();
                onUpdate({ recentActivity: activity }, true);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
};
