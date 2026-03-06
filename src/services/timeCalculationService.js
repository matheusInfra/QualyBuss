/**
 * timeCalculationService.js
 * The "Engine" for processing Time Entries into Payroll Data.
 * 
 * Logic:
 * 1. Reads Raw Punches.
 * 2. Reads Collaborator Schedule.
 * 3. Calculates: Worked, Expected, Balance, Overtime, Night Shift.
 * 4. Persists to 'daily_balances' and updates 'time_bank'.
 */

import { supabase } from './supabase';
import { timePolicyService } from './timePolicyService';

export const timeCalculationService = {

    /**
     * Trigger calculation for a specific user and date range.
     * Usually called by Admin or Nightly Job.
     */
    async recalculatePeriod(userId, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const results = [];
        // Iterate days
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const result = await this.processDay(userId, dateStr);
            results.push(result);
        }

        await this.updateTimeBank(userId);
        return results;
    },

    /**
     * Process a single day: Raw -> Calculated Balance
     */
    async processDay(userId, dateStr) {
        // 1. Fetch Data (Parallel)
        const [userRes, entriesRes, absenceRes] = await Promise.all([
            this.getCollaboratorSchedule(userId),
            supabase.from('time_entries').select('*')
                .eq('user_id', userId)
                .gte('clock_in', `${dateStr}T00:00:00`)
                .lte('clock_in', `${dateStr}T23:59:59`)
                .order('clock_in', { ascending: true }),
            supabase.from('absence_transactions').select('*')
                .eq('collaborator_id', userId)
                .eq('effective_date', dateStr)
                .limit(1)
        ]);

        const schedule = userRes?.work_schedule;
        const entries = entriesRes.data || [];
        const dateObj = new Date(dateStr + 'T00:00:00'); // Local time assumption for simplicity

        // 2. Calculate Worked Minutes & Night Shift Minutes
        const workedMinutes = timePolicyService.calculateWorkedMinutes(entries);
        const nightShiftMinutes = timePolicyService.calculateNightShiftMinutes ? timePolicyService.calculateNightShiftMinutes(entries) : 0;

        // 3. Calculate Expected Minutes
        const shift = timePolicyService.getExpectedShiftForDate(schedule, dateObj);
        let expectedMinutes = 0;
        if (shift) {
            const startMin = timePolicyService.timeToMinutes(shift.start);
            const endMin = timePolicyService.timeToMinutes(shift.end);
            expectedMinutes = endMin - startMin - 60; // -1h Lunch standard
        }

        const absence = absenceRes?.data?.[0];

        // 4. Apply Rules (Tolerance, etc)
        let balance = 0;
        let overtime50 = 0;
        let overtime100 = 0; // Sundays/Holidays
        let finalStatus = 'OK';

        if (shift) {
            // Is it a full Absence?
            if (entries.length === 0) {
                if (absence) {
                    balance = 0; // Justified, no debit
                    finalStatus = 'JUSTIFIED';
                } else {
                    balance = -expectedMinutes; // Full debit
                    finalStatus = 'ABSENCE'; // Unjustified
                }
            } else {
                balance = workedMinutes - expectedMinutes;

                // CLT Tolerance: +/- 10 mins (Art 58)
                if (Math.abs(balance) <= 10) {
                    balance = 0;
                }

                if (balance > 0) {
                    const day = dateObj.getDay();
                    if (day === 0) { // Sunday
                        overtime100 = balance;
                    } else {
                        overtime50 = balance;
                    }
                }

                if (entries.length % 2 !== 0) {
                    finalStatus = 'INCOMPLETE';
                } else if (balance < 0) {
                    finalStatus = 'DEBIT';
                }
            }
        } else {
            // Day Off work
            if (workedMinutes > 0) {
                balance = workedMinutes;
                overtime100 = workedMinutes; // Work on day off is usually 100%
                if (entries.length % 2 !== 0) {
                    finalStatus = 'INCOMPLETE';
                }
            }
        }

        // 5. Persist to DB (using standard payload to prevent breaking schema)
        // If the DB doesn't have the night_shift column yet, we try to pass it. If it fails, we fall back to generic.
        const payload = {
            user_id: userId,
            date: dateStr,
            expected_minutes: expectedMinutes,
            worked_minutes: workedMinutes,
            balance_minutes: balance,
            overtime_50: overtime50,
            overtime_100: overtime100,
            night_shift_minutes: nightShiftMinutes, // New Field for Add. Noturno Calculation
            status: finalStatus,
            updated_at: new Date()
        };

        const { error } = await supabase.from('daily_balances').upsert(payload, { onConflict: 'user_id, date' });

        // Safe fallback mechanism if Supabase hasn't the night_shift_minutes column instantiated yet.
        if (error && error.code === 'PGRST204') {
            console.warn('[TimeEngine] Safe fallback: DB schema missing night_shift_minutes column. Saving without it for backwards compatibility.');
            delete payload.night_shift_minutes;
            await supabase.from('daily_balances').upsert(payload, { onConflict: 'user_id, date' });
        } else if (error) {
            console.error('Error saving balance:', error);
        }

        return payload;
    },

    /**
     * Update the total Bank of Hours for the user
     */
    async updateTimeBank(userId) {
        // Sum all balances
        const { data, error } = await supabase
            .from('daily_balances')
            .select('balance_minutes')
            .eq('user_id', userId);

        if (error || !data) return;

        const totalBalance = data.reduce((acc, curr) => acc + (curr.balance_minutes || 0), 0);

        await supabase.from('time_bank').upsert({
            user_id: userId,
            current_balance_minutes: totalBalance,
            last_calculation_date: new Date(),
            updated_at: new Date()
        });
    },

    // Helper to get schedule
    async getCollaboratorSchedule(userId) {
        // Correção Híbrida: Buscar DIRETAMENTE na tabela de colaboradores pelo ID.
        // Isso garante que pessoas sem histórico de ponto digital (ex: usam relógio físico)
        // ainda recebam Faltas calculadas pelo Motor caso não haja importação de AFD.
        const { data: collab, error } = await supabase
            .from('collaborators')
            .select('work_schedule, weekly_hours')
            .eq('collaborator_id', userId)
            .maybeSingle();

        if (error || !collab) {
            console.warn(`[TimeEngine] Escala não encontrada para o usuário: ${userId}`);
            return null;
        }

        return collab;
    }
};
