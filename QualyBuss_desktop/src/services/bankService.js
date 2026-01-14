// Service to fetch banks from BrasilAPI
// https://brasilapi.com.br/docs# bancos

const CACHE_KEY = 'brazilian_banks_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const bankService = {
    async getBanks() {
        try {
            // Check cache
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { timestamp, data } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    return data;
                }
            }

            // Fetch from API
            const response = await fetch('https://brasilapi.com.br/api/banks/v1');
            if (!response.ok) throw new Error('Failed to fetch banks');

            const data = await response.json();

            // Format and sort: "Code - Name"
            const formattedUnknown = data
                .filter(b => b.code && b.name)
                .map(b => ({
                    code: b.code,
                    name: b.name,
                    fullName: `${b.code} - ${b.name}`
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            // Save to cache
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: formattedUnknown
            }));

            return formattedUnknown;

        } catch (error) {
            console.error("Error fetching banks:", error);
            // Fallback list of major banks if API fails
            return [
                { code: '001', name: 'Banco do Brasil', fullName: '001 - Banco do Brasil' },
                { code: '033', name: 'Santander', fullName: '033 - Santander' },
                { code: '104', name: 'Caixa Econômica Federal', fullName: '104 - Caixa Econômica Federal' },
                { code: '237', name: 'Bradesco', fullName: '237 - Bradesco' },
                { code: '341', name: 'Itaú', fullName: '341 - Itaú' },
                { code: '260', name: 'Nubank', fullName: '260 - Nubank' },
                { code: '077', name: 'Inter', fullName: '077 - Inter' }
            ];
        }
    }
};
