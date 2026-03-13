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

        // Parallel fetch for Active and Inactive + departamentos oficiais
        const [activeRes, inactiveRes, deptRes] = await Promise.all([
            supabase.from('collaborators')
                .select('id, full_name, role, department, salary, birth_date, admission_date, avatar_url')
                .eq('active', true),
            supabase.from('collaborators')
                .select('id', { count: 'exact', head: true })
                .eq('active', false),
            supabase.from('departments')
                .select('name')
                .order('name')
        ]);

        const activeCollabs = activeRes.data || [];
        const inactiveCount = inactiveRes.count || 0;
        const officialDepts = (deptRes.data || []).map(d => d.name);

        // Calculations — só o total agregado transita, não salários individuais
        const payroll = activeCollabs.reduce((sum, c) => sum + (Number(c.salary) || 0), 0);

        const currentMonth = now.getMonth();
        const birthdays = activeCollabs.filter(c => {
            if (!c.birth_date) return false;
            const parts = c.birth_date.split('-');
            if (parts.length < 3) return false;
            return (parseInt(parts[1]) - 1) === currentMonth;
        });

        // Distribuição por departamento — usa nomes oficiais como base
        const deptDist = {};
        // Inicializar com departamentos oficiais (mesmo que zerados, aparecem no gráfico)
        officialDepts.forEach(d => { deptDist[d] = 0; });
        activeCollabs.forEach(c => {
            const dept = c.department || 'Sem Departamento';
            deptDist[dept] = (deptDist[dept] || 0) + 1;
        });
        // Remover departamentos oficiais que ficaram com 0 colaboradores para não poluir o gráfico
        Object.keys(deptDist).forEach(k => {
            if (deptDist[k] === 0) delete deptDist[k];
        });

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

        const { data, error: _error } = await supabase.from('occurrences')
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
            if (l.status === 'PENDING') return false;
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
        const { count } = await supabase.from('job_movements')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'PENDING');

        return {
            pendingMovements: count || 0
        };
    },

    async fetchComplianceMetrics() {
        // 1. Fetch mandatory rules
        const { data: rules } = await supabase
            .from('compliance_rules')
            .select('category, frequency, closing_day')
            .eq('is_mandatory', true);

        const mandatoryRules = rules || [];

        // 2. Fetch Active Collaborators (apenas IDs — leve)
        const { data: activeCollabs } = await supabase
            .from('collaborators')
            .select('id')
            .eq('active', true);

        const totalActive = activeCollabs?.length || 0;

        if (totalActive === 0) {
            return { complianceRate: 100, missingDocsCount: 0, totalActive: 0 };
        }

        if (mandatoryRules.length === 0) {
            return { complianceRate: 100, missingDocsCount: 0, totalActive };
        }

        const activeIds = activeCollabs.map(c => c.id);

        // 3. Fetch documents only for active collaborators and only categories that matter
        const { data: docs } = await supabase
            .from('collaborator_documents')
            .select('collaborator_id, category, reference_period')
            .in('collaborator_id', activeIds)
            .in('category', mandatoryRules.map(r => r.category));

        const today = new Date();
        const reqYear = today.getFullYear();
        const reqMonth = today.getMonth() + 1;

        // 4. Group by collaborator
        const collabsDocs = {};
        (docs || []).forEach(doc => {
            if (!collabsDocs[doc.collaborator_id]) {
                collabsDocs[doc.collaborator_id] = [];
            }
            collabsDocs[doc.collaborator_id].push(doc);
        });

        // 5. Check compliance
        let compliantCount = 0;
        activeIds.forEach(id => {
            const userDocs = collabsDocs[id] || [];

            const isCompliant = mandatoryRules.every(rule => {
                if (rule.frequency === 'UNIQUE') {
                    return userDocs.some(d => d.category === rule.category);
                } else if (rule.frequency === 'MONTHLY') {
                    let expectedMonth = reqMonth - 1;
                    let expectedYear = reqYear;
                    if (expectedMonth === 0) {
                        expectedMonth = 12;
                        expectedYear--;
                    }

                    if (today.getDate() < (rule.closing_day || 31)) {
                        expectedMonth--;
                        if (expectedMonth === 0) {
                            expectedMonth = 12;
                            expectedYear--;
                        }
                    }
                    const expectedPeriod = `${expectedYear}-${expectedMonth.toString().padStart(2, '0')}`;
                    return userDocs.some(d => d.category === rule.category && d.reference_period === expectedPeriod);
                }
                return true;
            });

            if (isCompliant) {
                compliantCount++;
            }
        });

        const missingDocsCount = totalActive - compliantCount;
        const complianceRate = Math.round((compliantCount / totalActive) * 100);

        return {
            complianceRate,
            missingDocsCount,
            totalActive
        };
    },

    async fetchAuditMetrics() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const isoYesterday = yesterday.toISOString();

        const [critRes, logsRes] = await Promise.all([
            supabase
                .from('audit_logs')
                .select('id', { count: 'exact', head: true })
                .eq('operation', 'DELETE')
                .gt('changed_at', isoYesterday),
            supabase
                .from('audit_logs')
                .select('id', { count: 'exact', head: true })
                .gt('changed_at', isoYesterday)
        ]);

        return {
            auditCriticalAlerts: critRes.count || 0,
            auditDailyLogs: logsRes.count || 0
        };
    },

    async fetchPontoMetrics() {
        const { startOfMonth, endOfMonth } = this._getDates();
        const todayStr = new Date().toISOString().split('T')[0];

        const [monthRes, todayRes] = await Promise.all([
            supabase
                .from('daily_balances')
                .select('user_id, status, expected_minutes')
                .gte('date', startOfMonth.split('T')[0])
                .lte('date', endOfMonth.split('T')[0])
                .gt('expected_minutes', 0),
            supabase
                .from('daily_balances')
                .select('user_id, status')
                .eq('date', todayStr)
                .gt('expected_minutes', 0)
        ]);

        let monthComplianceRate = 100;
        const monthBalances = monthRes.data;

        if (!monthRes.error && monthBalances && monthBalances.length > 0) {
            const totalWorkDays = monthBalances.length;
            const compliantDays = monthBalances.filter(b =>
                b.status !== 'DEBIT' && b.status !== 'INCOMPLETE' && b.status !== 'ABSENCE'
            ).length;
            monthComplianceRate = Math.round((compliantDays / totalWorkDays) * 100);
        }

        let earlyDelaysOrAbsencesToday = 0;
        let onTimeToday = 0;
        const todayBalances = todayRes.data;

        if (!todayRes.error && todayBalances) {
            todayBalances.forEach(b => {
                if (b.status === 'DEBIT' || b.status === 'INCOMPLETE' || b.status === 'ABSENCE') {
                    earlyDelaysOrAbsencesToday++;
                } else {
                    onTimeToday++;
                }
            });
        }

        return {
            pontoComplianceRate: monthComplianceRate,
            pontoTodayDelays: earlyDelaysOrAbsencesToday,
            pontoTodayOnTime: onTimeToday,
            pontoTotalExpectedToday: (earlyDelaysOrAbsencesToday + onTimeToday)
        };
    },

    // --- Main Initial Fetcher (RESILIENTE com allSettled) ---
    async getKPIs() {
        try {
            const results = await Promise.allSettled([
                this.fetchCollaboratorMetrics(),
                this.fetchOccurrenceMetrics(),
                this.fetchAbsenceMetrics(),
                this.fetchMovementMetrics(),
                this.fetchComplianceMetrics(),
                this.fetchAuditMetrics(),
                this.fetchPontoMetrics()
            ]);

            // Mescla apenas os que tiveram sucesso; os que falharam são ignorados silenciosamente
            const merged = {};
            results.forEach(r => {
                if (r.status === 'fulfilled' && r.value) {
                    Object.assign(merged, r.value);
                } else if (r.status === 'rejected') {
                    console.warn('Dashboard KPI parcial falhou:', r.reason);
                }
            });

            return merged;

        } catch (error) {
            console.error("Dashboard KPI Error:", error);
            return null;
        }
    },

    async getRecentActivity() {
        try {
            const [recentOccurrences, recentMovements] = await Promise.all([
                supabase.from('occurrences')
                    .select('id, title, created_at, type, collaborators(full_name)')
                    .order('created_at', { ascending: false })
                    .limit(5),
                supabase.from('job_movements')
                    .select('id, type, created_at, status, collaborators(full_name)')
                    .order('created_at', { ascending: false })
                    .limit(5)
            ]);

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

    // --- Realtime Subscription (com Debounce para evitar duplicatas) ---
    subscribeToChanges(onUpdate) {
        let activityDebounceTimer = null;

        // Função central de atualização de atividade com debounce
        const debouncedActivityRefresh = () => {
            if (activityDebounceTimer) clearTimeout(activityDebounceTimer);
            activityDebounceTimer = setTimeout(async () => {
                try {
                    const activity = await this.getRecentActivity();
                    onUpdate({ recentActivity: activity }, true);
                } catch (err) {
                    console.error('Debounced activity refresh failed:', err);
                }
            }, 500); // 500ms debounce — coalesce múltiplos eventos
        };

        const channel = supabase.channel('dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'occurrences' }, async () => {
                try {
                    const data = await this.fetchOccurrenceMetrics();
                    onUpdate(data);
                    debouncedActivityRefresh();
                } catch (err) {
                    console.error('Error handling occurrence update:', err);
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'collaborators' }, async () => {
                try {
                    const data = await this.fetchCollaboratorMetrics();
                    onUpdate(data);
                } catch (err) {
                    console.error('Error handling collaborator update:', err);
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, async () => {
                try {
                    const data = await this.fetchAbsenceMetrics();
                    onUpdate(data);
                } catch (err) {
                    console.error('Error handling leave request update:', err);
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'job_movements' }, async () => {
                try {
                    const data = await this.fetchMovementMetrics();
                    onUpdate(data);
                    debouncedActivityRefresh();
                } catch (err) {
                    console.error('Error handling job movement update:', err);
                }
            })
            .subscribe();

        return () => {
            if (activityDebounceTimer) clearTimeout(activityDebounceTimer);
            supabase.removeChannel(channel);
        };
    }
};
