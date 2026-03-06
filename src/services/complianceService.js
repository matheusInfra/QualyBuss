import { supabase } from './supabase';

export const complianceService = {
    // Buscar todas as regras
    async getRules() {
        try {
            const { data, error } = await supabase
                .from('compliance_rules')
                .select('*')
                .order('category', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar regras de compliance:', error);
            return [];
        }
    },

    // Criar nova regra (categoria documental)
    async create(payload) {
        if (!payload.category?.trim()) throw new Error('A Categoria do documento é obrigatória.');

        const { data: existing } = await supabase
            .from('compliance_rules')
            .select('id, category')
            .filter('category', 'ilike', payload.category.trim())
            .maybeSingle();

        if (existing) {
            throw new Error(`A regra para a categoria "${existing.category}" já existe.`);
        }

        const { data, error } = await supabase
            .from('compliance_rules')
            .insert([{
                category: payload.category.trim(),
                is_mandatory: payload.is_mandatory,
                description: payload.description || null
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Atualizar regra
    async update(id, updates) {
        if (updates.category && !updates.category.trim()) {
            throw new Error('A Categoria não pode ser vazia.');
        }

        if (updates.category) {
            const { data: existing } = await supabase
                .from('compliance_rules')
                .select('id, category')
                .filter('category', 'ilike', updates.category.trim())
                .neq('id', id)
                .maybeSingle();

            if (existing) {
                throw new Error(`A categoria "${existing.category}" já está cadastrada.`);
            }
        }

        const payloadToUpdate = { ...updates };
        if (payloadToUpdate.category) payloadToUpdate.category = payloadToUpdate.category.trim();

        const { data, error } = await supabase
            .from('compliance_rules')
            .update(payloadToUpdate)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Deletar a regra fisicamente
    async delete(id) {
        const { error } = await supabase
            .from('compliance_rules')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Erro ao deletar regra de compliance", error);
            throw new Error('Erro ao excluir regra. Verifique se existem documentos amarrados a ela no banco.');
        }
    }
};
