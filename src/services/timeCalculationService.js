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
        const [userRes, entriesRes] = await Promise.all([
            // Use time_entries_view to get schedule directly if possible, or join. 
            // For now, simple fetch via email requires mapping. 
            // Better: Get schedule from most recent time_entry_view for that user? 
            // Or just fetch collaborators by email (requires email).
            this.getCollaboratorSchedule(userId),
            supabase.from('time_entries').select('*')
                .eq('user_id', userId)
                .gte('clock_in', `${dateStr}T00:00:00`)
                .lte('clock_in', `${dateStr}T23:59:59`)
                .order('clock_in', { ascending: true })
        ]);

        const schedule = userRes?.work_schedule;
        const entries = entriesRes.data || [];
        const dateObj = new Date(dateStr + 'T00:00:00'); // Local time assumption for simplicity

        // 2. Calculate Worked Minutes
        const workedMinutes = timePolicyService.calculateWorkedMinutes(entries);

        // 3. Calculate Expected Minutes
        const shift = timePolicyService.getExpectedShiftForDate(schedule, dateObj);
        let expectedMinutes = 0;
        if (shift) {
            const startMin = timePolicyService.timeToMinutes(shift.start);
            const endMin = timePolicyService.timeToMinutes(shift.end);
            expectedMinutes = endMin - startMin - 60; // -1h Lunch standard
        }

        // 4. Apply Rules (Tolerance, etc)
        let balance = 0;
        let overtime50 = 0;
        let overtime100 = 0; // Sundays/Holidays

        if (shift) {
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
        } else {
            // Day Off work
            if (workedMinutes > 0) {
                balance = workedMinutes;
                overtime100 = workedMinutes; // Work on day off is usually 100%
            }
        }

        // 5. Persist to DB
        const payload = {
            user_id: userId,
            date: dateStr,
            expected_minutes: expectedMinutes,
            worked_minutes: workedMinutes,
            balance_minutes: balance,
            overtime_50: overtime50,
            overtime_100: overtime100,
            status: entries.length % 2 !== 0 ? 'INCOMPLETE' : (balance < 0 ? 'DEBIT' : 'OK'),
            updated_at: new Date()
        };

        const { error } = await supabase.from('daily_balances').upsert(payload, { onConflict: 'user_id, date' });
        if (error) console.error('Error saving balance:', error);

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
        // Try to get email first from time_entries_view (easiest way provided we have entries)
        const { data: entry } = await supabase.from('time_entries_view').select('user_email').eq('user_id', userId).limit(1).maybeSingle();
        if (!entry?.user_email) return null;

        const { data: collab } = await supabase.from('collaborators').select('work_schedule, weekly_hours').eq('corporate_email', entry.user_email).single();
        return collab;
    }
};
