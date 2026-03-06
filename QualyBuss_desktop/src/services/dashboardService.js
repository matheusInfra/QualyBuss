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

    async fetchComplianceMetrics() {
        // 1. Fetch mandatory rules
        const { data: rules } = await supabase
            .from('compliance_rules')
            .select('category, frequency, closing_day')
            .eq('is_mandatory', true);

        const mandatoryRules = rules || [];

        // 2. Fetch Active Collaborators
        const { data: activeCollabs } = await supabase
            .from('collaborators')
            .select('id')
            .eq('active', true);

        const totalActive = activeCollabs?.length || 0;

        if (totalActive === 0) {
            return { complianceRate: 100, missingDocsCount: 0, totalActive: 0 };
        }

        if (mandatoryRules.length === 0) {
            // No mandatory rules = Everyone is compliant
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
        const reqMonth = today.getMonth() + 1; // 1 to 12

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
                    // Just needs to exist
                    return userDocs.some(d => d.category === rule.category);
                } else if (rule.frequency === 'MONTHLY') {
                    // Needs to match the expected period
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

        // 1. Critical Actions (DELETE) last 24h
        const { count: criticalAlerts } = await supabase
            .from('audit_logs')
            .select('id', { count: 'exact', head: true })
            .eq('operation', 'DELETE')
            .gt('changed_at', isoYesterday);

        // 2. Total Daily Interactions
        const { count: dailyLogs } = await supabase
            .from('audit_logs')
            .select('id', { count: 'exact', head: true })
            .gt('changed_at', isoYesterday);

        return {
            auditCriticalAlerts: criticalAlerts || 0,
            auditDailyLogs: dailyLogs || 0
        };
    },

    async fetchPontoMetrics() {
        // Obter datas do mês corrente e do dia de hoje para consultas  
        const { startOfMonth, endOfMonth } = this._getDates();

        // Formatar o "hoje" pro banco
        const todayStr = new Date().toISOString().split('T')[0];

        // Consulta 1: Conformidade do Mês atual (para calcular a Média Mensal de Assiduidade)
        const { data: monthBalances, error: errMonth } = await supabase
            .from('daily_balances')
            .select('user_id, status, expected_minutes')
            .gte('date', startOfMonth.split('T')[0])
            .lte('date', endOfMonth.split('T')[0])
            .gt('expected_minutes', 0); // Considerar apenas dias que a pessoa DEVERIA trabalhar

        // Consulta 2: Posição específica de HOJE
        const { data: todayBalances, error: errToday } = await supabase
            .from('daily_balances')
            .select('user_id, status')
            .eq('date', todayStr)
            .gt('expected_minutes', 0); // Só contar quem devia trabalhar hoje

        let monthComplianceRate = 100; // Começa em 100, padrão

        if (!errMonth && monthBalances && monthBalances.length > 0) {
            const totalWorkDays = monthBalances.length;
            // Dias de pontualidade ou banco extra (sem atrasos ou faltas não compensadas) => OK ou OVERTIME/CREDIT ou JUSTIFIED
            // Qualquer status que seja DEBIT, INCOMPLETE ou ABSENCE é inconsistência e derruba o placar
            const compliantDays = monthBalances.filter(b =>
                b.status !== 'DEBIT' && b.status !== 'INCOMPLETE' && b.status !== 'ABSENCE'
            ).length;
            monthComplianceRate = Math.round((compliantDays / totalWorkDays) * 100);
        }

        let earlyDelaysOrAbsencesToday = 0;
        let onTimeToday = 0;

        if (!errToday && todayBalances) {
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

    // --- Main Initial Fetcher ---
    async getKPIs() {
        try {
            const [collab, occur, absence, move, comp, audit, ponto] = await Promise.all([
                this.fetchCollaboratorMetrics(),
                this.fetchOccurrenceMetrics(),
                this.fetchAbsenceMetrics(),
                this.fetchMovementMetrics(),
                this.fetchComplianceMetrics(),
                this.fetchAuditMetrics(),
                this.fetchPontoMetrics()
            ]);

            return {
                ...collab,
                ...occur,
                ...absence,
                ...move,
                ...comp,
                ...audit,
                ...ponto
            };

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
                try {
                    const data = await this.fetchOccurrenceMetrics();
                    onUpdate(data);
                    // Also update recent activity
                    const activity = await this.getRecentActivity();
                    onUpdate({ recentActivity: activity }, true); // special flag if needed
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
                    const activity = await this.getRecentActivity();
                    onUpdate({ recentActivity: activity }, true);
                } catch (err) {
                    console.error('Error handling job movement update:', err);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
};
