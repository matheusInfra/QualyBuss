import { supabase } from './supabase';

export const collaboratorService = {
    // Buscar todos os colaboradores
    async getAll() {
        // Tenta buscar do Supabase
        const { data, error } = await supabase
            .from('collaborators')
            .select('*')
            .order('full_name');

        if (error) {
            console.error('Erro ao buscar colaboradores:', error);
            return [];
        }

        return data || [];
    },

    // Buscar por ID
    async getById(id) {
        const { data, error } = await supabase
            .from('collaborators')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Criar novo
    async create(collaborator) {
        const { data, error } = await supabase
            .from('collaborators')
            .insert([formatPayload(collaborator)])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Atualizar
    async update(id, collaborator) {
        const { data, error } = await supabase
            .from('collaborators')
            .update(formatPayload(collaborator))
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Alternar Status (Inativar/Ativar)
    async toggleStatus(id, currentStatus) {
        const { data, error } = await supabase
            .from('collaborators')
            .update({ active: !currentStatus })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Upload de Avatar
    async uploadAvatar(file, fileName) {
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return publicUrl;
    }
};

// Helper para formatar dados do formulário para o banco
const formatPayload = (data) => {
    // Ajuste conforme necessário para mapear campos do form para colunas do DB
    return {
        ...data,
        // Garante que campos vazios virem null para não quebrar constraints se houver
        cpf: data.cpf || null,
        admission_date: data.admission_date || null,
        birth_date: data.birth_date || null
    };
};
