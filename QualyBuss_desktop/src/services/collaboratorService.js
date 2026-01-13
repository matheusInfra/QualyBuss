import { supabase } from './supabase';

export const collaboratorService = {
    // Buscar todos os colaboradores
    async getAll() {
        // Alias para manter compatibilidade, mas idealmente migraríamos para paginação
        return this.getAllRaw();
    },

    async getAllRaw() {
        const { data, error } = await supabase
            .from('collaborators')
            .select('*')
            .order('full_name');
        if (error) {
            console.error('Erro ao buscar todos:', error);
            return [];
        }
        return data || [];
    },

    // Buscar com Paginação e Filtros
    async getPaginated({ page = 1, limit = 30, status = 'active', searchTerm = '' }) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        // Otimização: Selecionar apenas campos necessários para o Card/Lista
        let query = supabase
            .from('collaborators')
            .select('id, full_name, role, department, active, avatar_url', { count: 'exact' });

        // Filtro de Status
        if (status === 'active') {
            query = query.eq('active', true);
        } else if (status === 'inactive') {
            query = query.eq('active', false);
        }
        // 'all' não aplica filtro de active

        // Filtro de Busca (Nome ou Cargo)
        if (searchTerm) {
            query = query.or(`full_name.ilike.%${searchTerm}%,role.ilike.%${searchTerm}%`);
        }

        const { data, count, error } = await query
            .order('full_name')
            .range(from, to);

        if (error) {
            console.error('Erro na paginação:', error);
            return { data: [], count: 0 };
        }

        return { data, count };
    },

    // Verificar duplicidade de CPF
    async checkDuplicate(cpf, excludeId = null) {
        if (!cpf) return false;

        let query = supabase
            .from('collaborators')
            .select('id')
            .eq('cpf', cpf);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query.single();

        // Se encontrar um registro (data não é null), é duplicado.
        // Se der erro 'PGRST116' (0 rows), não é duplicado.
        if (error && error.code !== 'PGRST116') {
            console.error('Erro ao verificar duplicidade', error);
            return false; // Assume falso em caso de erro para não bloquear, ou trate diferente
        }

        return !!data;
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
