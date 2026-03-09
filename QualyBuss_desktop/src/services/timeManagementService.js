import { supabase } from './supabase';

export const timeManagementService = {
    /**
     * Fetch all time entries with filters (Admin View)
     */
    async getAllEntries({ startDate, endDate, userId }) {
        let query = supabase
            .from('time_entries_view')
            .select(`*`)
            .order('clock_in', { ascending: false });

        if (startDate) query = query.gte('clock_in', `${startDate}T00:00:00`);
        if (endDate) query = query.lte('clock_in', `${endDate}T23:59:59`);
        if (userId) query = query.eq('user_id', userId);

        const { data, error } = await query;
        if (error) throw error;

        return data.map(entry => {
            const entryDate = new Date(entry.clock_in);
            let anomaly = null;

            // Extract Schedule Rules (Nested or Direct)
            const schedule = entry.work_schedule;

            if (!schedule) {
                // If no schedule is active, we can't calculate precision
            } else {
                const dayMap = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
                const dayCode = dayMap[entryDate.getDay()];

                // 1. Check if it's a Working Day
                let isWorkingDay = schedule.days && schedule.days.includes(dayCode);

                // Overnight Logic Fix
                if (!isWorkingDay && entry.type === 'EXIT') {
                    const hours = entryDate.getHours();
                    if (hours < 12) {
                        const yesterday = new Date(entryDate);
                        yesterday.setDate(yesterday.getDate() - 1);
                        const prevDayMap = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
                        const prevDayCode = prevDayMap[yesterday.getDay()];
                        if (schedule.days && schedule.days.includes(prevDayCode)) isWorkingDay = true;
                    }
                }

                if (!isWorkingDay) {
                    anomaly = { type: 'CRITICAL', text: 'Dia de Folga (Hora Extra?)' };
                }

                // 2. Schedule Adherence
                else if (schedule.shifts && schedule.shifts.length > 0) {
                    const shift = schedule.shifts[0];
                    const tolerance = schedule.settings?.entry_tolerance_minutes || 10;

                    // --- ENTRY LOGIC ---
                    if (entry.type === 'ENTRY') {
                        const expectedStart = timeToMinutes(shift.start); // e.g., 08:00 -> 480
                        const actualTime = entryDate.getHours() * 60 + entryDate.getMinutes();

                        // Check Delay (Considering Tolerance)
                        if (actualTime > expectedStart + tolerance) {
                            const delay = actualTime - expectedStart;
                            anomaly = { type: 'CRITICAL', text: `Atraso: ${delay}min` };
                        }
                    }

                    // --- EXIT LOGIC ---
                    else if (entry.type === 'EXIT') {
                        // Para lidar com pernoite, criamos objetos Date reais.
                        const startTimeParts = shift.start.split(':').map(Number);
                        const expectedStartDate = new Date(entryDate);
                        expectedStartDate.setHours(startTimeParts[0], startTimeParts[1], 0, 0);

                        const endTimeParts = shift.end.split(':').map(Number);
                        let expectedEndDate = new Date(entryDate);
                        expectedEndDate.setHours(endTimeParts[0], endTimeParts[1], 0, 0);

                        // Se o turno Expected End for numericamente menor que Start
                        // Significa que virou a noite (Ex: 22:00 -> 06:00)
                        if (expectedEndDate < expectedStartDate) {
                            expectedEndDate.setDate(expectedEndDate.getDate() + 1);
                        }

                        // Agora temos O MOMENTO real esperado da saída. E o MOMENTO real da batida.
                        // Calculamos Anomalias de Saída Antecipada (Checando milissegundos convertidos pra Minutos)
                        if (entryDate < expectedEndDate) {
                            const earlyMinutes = Math.floor((expectedEndDate.getTime() - entryDate.getTime()) / 60000);

                            if (earlyMinutes > 5) {
                                anomaly = { type: 'WARNING', text: `Saída Antecipada: ${earlyMinutes}min` };
                            }
                        }
                    }
                }
            }

            return {
                ...entry,
                userName: entry.user_name || entry.collaborator_name || entry.user_email || 'Desconhecido',
                userAvatar: entry.user_avatar,
                computedAnomaly: anomaly
            };
        });
    },

    /**
     * Get Bank of Hours Summary
     */
    async getBankOfHoursSummary(userId) {
        let query = supabase.from('time_bank').select('current_balance_minutes');

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (!data || data.length === 0) return '+00:00';

        const totalMinutes = data.reduce((acc, curr) => acc + (curr.current_balance_minutes || 0), 0);

        const sign = totalMinutes >= 0 ? '+' : '-';
        const absMinutes = Math.abs(totalMinutes);
        const hours = Math.floor(absMinutes / 60);
        const mins = absMinutes % 60;

        return `${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    },

    /**
     * Update status (Approve/Reject/Adjust)
     */
    async updateEntryStatus(id, status, notes) {
        const { data, error } = await supabase
            .from('time_entries')
            .update({
                status,
                admin_notes: notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update Entry Details (Time, Type, Justification)
     */
    async updateEntryDetails(id, { clock_in, type, justification }) {
        const { data, error } = await supabase
            .from('time_entries')
            .update({
                clock_in,
                type,
                admin_notes: justification, // Saving justification in notes
                status: 'VALID', // Auto-validate on edit
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// Helper: Convert "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};
