export const cepService = {
    async searchCep(cep) {
        // Remove non-digits
        const cleanCep = cep.replace(/\D/g, '');

        if (cleanCep.length !== 8) {
            throw new Error('CEP inválido.');
        }

        try {
            // Tentativa 1: BrasilAPI (Fallback robusto e CORS amigável)
            const response1 = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
            if (response1.ok) {
                const data1 = await response1.json();
                return {
                    address_street: data1.street || '',
                    address_district: data1.neighborhood || '',
                    address_city: data1.city || '',
                    address_state: data1.state || '',
                    address_zip_code: data1.cep || cleanCep
                };
            }
            throw new Error('BrasilAPI falhou.');
        } catch {
            try {
                // Tentativa 2: ViaCEP
                const response2 = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                if (response2.ok) {
                    const data2 = await response2.json();
                    if (!data2.erro) {
                        return {
                            address_street: data2.logradouro || '',
                            address_district: data2.bairro || '',
                            address_city: data2.localidade || '',
                            address_state: data2.uf || '',
                            address_zip_code: data2.cep || cleanCep
                        };
                    }
                }
                throw new Error('ViaCEP falhou ou não encontrou.');
            } catch (error2) {
                console.error("Erro CEP:", error2);
                throw new Error('Nenhum serviço de CEP respondeu ou CEP não existe. Por favor, preencha manualmente.');
            }
        }
    }
};
