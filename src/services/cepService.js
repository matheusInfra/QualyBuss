
export const cepService = {
    async searchCep(cep) {
        // Remove non-digits
        const cleanCep = cep.replace(/\D/g, '');

        if (cleanCep.length !== 8) {
            throw new Error('CEP inválido.');
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();

            if (data.erro) {
                throw new Error('CEP não encontrado.');
            }

            return {
                address_street: data.logradouro,
                address_district: data.bairro, // You might need a field for district if not exists, otherwise map to existing
                address_city: data.localidade,
                address_state: data.uf,
                address_zip_code: data.cep // Return formatted
            };
        } catch (error) {
            throw error;
        }
    }
};
