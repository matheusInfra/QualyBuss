import { supabase } from './supabase';
<<<<<<< HEAD
import { createClient } from '@supabase/supabase-js';
=======
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f

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

        const { data, error } = await query.maybeSingle();

        if (error) {
            console.error('Erro ao verificar duplicidade', error);
            return false;
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

<<<<<<< HEAD
    // Criar novo (Híbrido: Com ou Sem Auto-Auth)
    async create(collaborator) {
        // FLUXO 1: Auto-Auth (Se tiver senha e email corporativo)
        if (collaborator.password && collaborator.corporate_email) {
            console.log('Criando colaborador com login automático via Client-Side Admin...');

            // 1. Instanciar cliente Admin (usando Service Role Key)
            const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

            if (!serviceRoleKey) {
                throw new Error('CONFIGURAÇÃO: Falta VITE_SUPABASE_SERVICE_ROLE_KEY no .env');
            }

            const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });

            // 2. Criar Usuário no Auth
            const emailToCreate = collaborator.corporate_email.trim();
            console.log(`[ClientAdmin] Tentando criar usuário para: '${emailToCreate}'`);

            const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
                email: emailToCreate,
                password: collaborator.password,
                email_confirm: true,
                user_metadata: {
                    full_name: collaborator.full_name
                }
            });

            if (authError) {
                console.error('Erro ao Criar Auth:', authError);
                throw new Error(`Falha ao criar usuário: ${authError.message}`);
            }

            // 3. Preparar Payload com o user_id gerado
            const payload = formatPayload(collaborator);
            delete payload.password; // Garantir que senha não vai pro banco
            payload.user_id = authData.user.id; // VÍNCULO IMPORTANTE

            console.log('Usuário Auth criado:', authData.user.id, '. Inserindo dados...');

            // 4. Inserir no Banco (Usando o cliente Admin para garantir permissões se necessário, ou o normal)
            const { data: dbData, error: dbError } = await adminSupabase
                .from('collaborators')
                .insert([payload])
                .select()
                .single();

            if (dbError) {
                console.error('Erro no Banco. Fazendo Rollback do Auth...', dbError);
                // Rollback: Deletar o usuário criado para não deixar órfão
                await adminSupabase.auth.admin.deleteUser(authData.user.id);
                throw new Error(`Erro ao salvar dados do colaborador: ${dbError.message}`);
            }

            return dbData;
        }

        // FLUXO 2: Legado (Apenas Banco de Dados, sem Login)
=======
    // Criar novo
    async create(collaborator) {
>>>>>>> 74de67d4837be6abce630f234cd7df17c160c62f
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
    const payload = { ...data };

    // Remove generated columns that cannot be updated
    delete payload.search_vector;

    // Remove campos auxiliares de UI que não existem no banco
    delete payload.isNewHire;

    // Garante que campos vazios virem null para não quebrar constraints se houver
    payload.cpf = payload.cpf || null;
    payload.admission_date = payload.admission_date || null;
    payload.birth_date = payload.birth_date || null;

    return payload;
};
