import { supabase } from './supabase';

export const roleService = {
    // Buscar todos os cargos (por padrão, apenas os ativos, a não ser que getAll seja true)
    async getRoles({ all = false } = {}) {
        try {
            let query = supabase
                .from('roles')
                .select('*')
                .order('name', { ascending: true });

            if (!all) {
                query = query.eq('active', true);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar cargos:', error);
            return [];
        }
    },

    // Criar um novo cargo
    async create(name) {
        if (!name?.trim()) throw new Error('O nome do cargo é obrigatório.');

        const { data: existing } = await supabase
            .from('roles')
            .select('id, name')
            .filter('name', 'ilike', name.trim())
            .maybeSingle();

        if (existing) {
            throw new Error(`Um cargo com o nome "${existing.name}" já existe na base.`);
        }

        const { data, error } = await supabase
            .from('roles')
            .insert([{ name: name.trim(), active: true }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Atualizar cargo (Nome ou Status)
    async update(id, updates) {
        if (updates.name && !updates.name.trim()) {
            throw new Error('O nome não pode ser vazio.');
        }

        if (updates.name) {
            const { data: existing } = await supabase
                .from('roles')
                .select('id, name')
                .filter('name', 'ilike', updates.name.trim())
                .neq('id', id)
                .maybeSingle();

            if (existing) {
                throw new Error(`Um cargo com o nome "${existing.name}" já existe na base.`);
            }
        }

        const payload = { ...updates };
        if (payload.name) payload.name = payload.name.trim();

        const { data, error } = await supabase
            .from('roles')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Deletar fisicamente (Não recomendado se houver vínculos)
    async delete(id) {
        const { error } = await supabase
            .from('roles')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Erro ao deletar cargo", error);
            throw new Error('Não é possível excluir um cargo atribuído a colaboradores. Recomendamos inativá-lo.');
        }
    }
};
