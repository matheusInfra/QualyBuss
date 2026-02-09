/**
 * timePolicyService.js
 * Intelligence Engine for Time Management (Gestão de Ponto)
 * 
 * Responsibilities:
 * 1. Calculate Expected Hours based on Schedule (JSON).
 * 2. Detect Anomalies (Late Arrival, Missing Punches).
 * 3. Calculate "Adherence Score".
 */

export const timePolicyService = {

    /**
     * Default Schedule for new employees
     */
    getDefaultSchedule() {
        return {
            days: ["MON", "TUE", "WED", "THU", "FRI"],
            shifts: [{ start: "08:00", end: "18:00" }] // Simple 08-18 rule
        };
    },

    /**
     * Default Lunch Policy
     */
    getDefaultLunchPolicy() {
        return {
            type: "VARIABLE", // or FIXED
            duration_minutes: 60,
            fixed_start: "12:00", // Only if FIXED
            fixed_end: "13:00"
        };
    },

    /**
     * Get expected shift for a specific date
     */
    getExpectedShiftForDate(schedule, dateObj) {
        if (!schedule || !schedule.days) return null;

        const dayMap = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        const dayCode = dayMap[dateObj.getDay()];

        if (!schedule.days.includes(dayCode)) return null; // Day off

        return schedule.shifts[0]; // Assuming single shift for now
    },

    /**
     * Convert "HH:MM" string to minutes from midnight
     */
    timeToMinutes(timeStr) {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    },

    /**
     * Analyze a single day's entries against the schedule
     * @returns {Object} { status, anomalies: [], adherenceScore, workedMinutes, expectedMinutes }
     */
    analyzeDailyEntries(schedule, entries = [], dateObj) {
        const expected = this.getExpectedShiftForDate(schedule, dateObj);

        // Scenario 1: Day Off
        if (!expected) {
            if (entries.length > 0) {
                return {
                    status: 'OVERTIME_DAY_OFF',
                    anomalies: ['Trabalho em dia de folga'],
                    adherenceScore: 0, // Needs manual review
                    workedMinutes: this.calculateWorkedMinutes(entries),
                    expectedMinutes: 0
                };
            }
            return { status: 'DAY_OFF', anomalies: [], adherenceScore: 100, workedMinutes: 0, expectedMinutes: 0 };
        }

        // Scenario 2: Work Day
        const expectedStartMin = this.timeToMinutes(expected.start);
        const expectedEndMin = this.timeToMinutes(expected.end);
        const expectedMinutes = expectedEndMin - expectedStartMin - 60; // Subtract standard lunch (simplified)

        if (entries.length === 0) {
            // Check if date is today or future
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const checkDate = new Date(dateObj);
            checkDate.setHours(0, 0, 0, 0);

            if (checkDate < today) {
                return { status: 'ABSENT', anomalies: ['Falta injustificada'], adherenceScore: 0, workedMinutes: 0, expectedMinutes };
            }
            return { status: 'PENDING', anomalies: [], adherenceScore: 100, workedMinutes: 0, expectedMinutes };
        }

        const workedMinutes = this.calculateWorkedMinutes(entries);
        const anomalies = [];

        // 1. Check Late Arrival
        // Find first ENTRY
        const firstEntry = entries.find(e => e.type === 'ENTRY');
        if (firstEntry) {
            const entryDate = new Date(firstEntry.clock_in);
            const entryMinutes = entryDate.getHours() * 60 + entryDate.getMinutes();
            // Tolerance 10 mins
            if (entryMinutes > expectedStartMin + 15) {
                anomalies.push(`Atraso na entrada (${entryMinutes - expectedStartMin} min)`);
            }
        } else {
            anomalies.push('Falta batida de Entrada');
        }

        // 2. Check Early Exit (if last punch is EXIT)
        const lastEntry = entries[0]; // Sorted DESC usually
        const sortedEntries = [...entries].sort((a, b) => new Date(a.clock_in) - new Date(b.clock_in));
        const finalExit = sortedEntries[sortedEntries.length - 1];

        if (finalExit && finalExit.type === 'EXIT') {
            const exitDate = new Date(finalExit.clock_in);
            const exitMinutes = exitDate.getHours() * 60 + exitDate.getMinutes();
            if (exitMinutes < expectedEndMin - 15) {
                anomalies.push(`Saída antecipada (${expectedEndMin - exitMinutes} min)`);
            }
        }

        // 3. Adherence Score
        let score = 100;
        if (anomalies.length > 0) score -= (anomalies.length * 10);

        // Check worked hours deviation
        if (expectedMinutes > 0) {
            const deviation = Math.abs(workedMinutes - expectedMinutes);
            const deviationPercent = (deviation / expectedMinutes) * 100;
            if (deviationPercent > 10) score -= 10;
        }

        return {
            status: anomalies.length > 0 ? 'ATTENTION' : 'OK',
            anomalies,
            adherenceScore: Math.max(0, score),
            workedMinutes,
            expectedMinutes
        };
    },

    /**
     * Helper: Sum worked minutes from entry pairs
     * Simplified logic: Assumes ENTRY -> EXIT, ENTRY -> EXIT pairs.
     */
    calculateWorkedMinutes(entries) {
        // Sort Ascending
        const sorted = [...entries].sort((a, b) => new Date(a.clock_in) - new Date(b.clock_in));
        let total = 0;
        let lastEntry = null;

        for (const entry of sorted) {
            if (entry.type === 'ENTRY' || entry.type === 'BREAK_END') {
                lastEntry = entry;
            } else if ((entry.type === 'EXIT' || entry.type === 'BREAK_START') && lastEntry) {
                const start = new Date(lastEntry.clock_in);
                const end = new Date(entry.clock_in);
                const diffMs = end - start;
                total += Math.floor(diffMs / 1000 / 60);
                lastEntry = null;
            }
        }

        // If still clocked in, calculate until NOW (Live view)
        if (lastEntry) {
            const start = new Date(lastEntry.clock_in);
            const end = new Date();
            // Only if same day
            if (start.toDateString() === end.toDateString()) {
                const diffMs = end - start;
                total += Math.floor(diffMs / 1000 / 60);
            }
        }

        return total;
    }
};
