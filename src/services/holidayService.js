const CACHE_KEY = 'holiday_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const holidayService = {
    async getHolidays(year) {
        // Check Cache
        const cached = localStorage.getItem(`${CACHE_KEY}_${year}`);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return data;
            }
        }

        try {
            // Using BrasilAPI
            const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
            if (!response.ok) throw new Error('Failed to fetch holidays');

            const data = await response.json();

            // Transform date strings to standard format if needed, BrasilAPI returns YYYY-MM-DD
            const formatted = data.map(holiday => ({
                date: holiday.date,
                name: holiday.name,
                type: holiday.type
            }));

            // Save to Cache
            localStorage.setItem(`${CACHE_KEY}_${year}`, JSON.stringify({
                data: formatted,
                timestamp: Date.now()
            }));

            return formatted;
        } catch (error) {
            console.warn('Holiday API failed, using fallback.', error);
            // Minimal Fallback for major holidays to prevent UI break
            return [
                { date: `${year}-01-01`, name: 'Confraternização Universal' },
                { date: `${year}-04-21`, name: 'Tiradentes' },
                { date: `${year}-05-01`, name: 'Dia do Trabalho' },
                { date: `${year}-09-07`, name: 'Independência do Brasil' },
                { date: `${year}-10-12`, name: 'Nossa Senhora Aparecida' },
                { date: `${year}-11-02`, name: 'Finados' },
                { date: `${year}-11-15`, name: 'Proclamação da República' },
                { date: `${year}-12-25`, name: 'Natal' }
            ];
        }
    },

    // Check if a date is a holiday
    isHoliday(dateStr, holidays) {
        return holidays.some(h => h.date === dateStr);
    },

    // Check if date is blocked for Vacation Start (CLT rules)
    // Rule: Cannot start in the 2 days preceding a holiday or weekly rest (Sunday)
    // Assuming Sunday is the Rest Day. So cannot start on Friday (2 days before) or Saturday (1 day before).
    isBlockedForStart(dateObj, holidays) {
        const dateStr = dateObj.toISOString().split('T')[0];
        const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat

        // blocked reasons
        let reasons = [];

        // 1. Weekly Rest Rule (Assuming Sunday)
        // Cannot start on Friday (5) or Saturday (6)
        if (dayOfWeek === 5) reasons.push('Antecede Descanso Semanal (Sexta-feira)');
        if (dayOfWeek === 6) reasons.push('Antecede Descanso Semanal (Sábado)');
        if (dayOfWeek === 0) reasons.push('Dia de Descanso (Domingo)');

        // 2. Holiday Rule
        // Check next 2 days
        const nextDay = new Date(dateObj); nextDay.setDate(dateObj.getDate() + 1);
        const twoDaysAfter = new Date(dateObj); twoDaysAfter.setDate(dateObj.getDate() + 2);

        const nextDayStr = nextDay.toISOString().split('T')[0];
        const twoDaysAfterStr = twoDaysAfter.toISOString().split('T')[0];

        const h1 = holidays.find(h => h.date === nextDayStr);
        const h2 = holidays.find(h => h.date === twoDaysAfterStr);
        const hCurrent = holidays.find(h => h.date === dateStr);

        if (hCurrent) reasons.push(`Feriado: ${hCurrent.name}`);
        if (h1) reasons.push(`Antecede Feriado: ${h1.name}`);
        if (h2) reasons.push(`Antecede Feriado: ${h2.name}`);

        return {
            blocked: reasons.length > 0,
            reasons
        };
    }
};
