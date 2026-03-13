import { supabase } from './supabase';

export const organogramService = {
    // Busca Posições e Ligações dos Colaboradores
    async getCollaboratorNodes() {
        const { data, error } = await supabase
            .from('collaborators')
            .select('id, full_name, role, department, manager_id, org_pos_x, org_pos_y, avatar_url, corporate_email, birth_date, admission_date, address_city, address_state, cpf, contract_type');
        
        if (error) {
            console.error('Erro ao buscar nós colaboradores:', error);
            return [];
        }
        return data || [];
    },

    // Busca Notas/Desenhos Extras
    async getAnnotations() {
        const { data, error } = await supabase
            .from('org_annotations')
            .select('*');
            
        if (error) {
            console.error('Erro ao buscar anotações:', error);
            return [];
        }
        return data || [];
    },

    // Busca linhas/setas Customizadas entre Anotações
    async getCustomEdges() {
        const { data, error } = await supabase
            .from('org_edges')
            .select('*');
            
        if (error) {
            console.error('Erro ao buscar conexões entre anotações:', error);
            return [];
        }
        return data || [];
    },

    // Salvar estado massivo do Canvas (Draft -> Live)
    async saveLayout(collaboratorUpdates, annotationUpdates, edgesToCreate) {
        try {
            // 1. Atualizar posições dos Colaboradores via Update individual 
            // (evita usar Upsert com dados parciais que quebram as constraints NOT NULL de nome, etc)
            if (collaboratorUpdates && collaboratorUpdates.length > 0) {
                const promises = collaboratorUpdates.map(col => 
                    supabase.from('collaborators').update({
                        org_pos_x: col.org_pos_x,
                        org_pos_y: col.org_pos_y
                    }).eq('id', col.id)
                );
                
                const results = await Promise.all(promises);
                const errors = results.filter(r => r.error);
                if (errors.length > 0) throw errors[0].error;
            }

            // 2. Atualizar ou Criar Anotações textuais via Upsert
            if (annotationUpdates && annotationUpdates.length > 0) {
                const { error: updError } = await supabase
                    .from('org_annotations')
                    .upsert(annotationUpdates, { onConflict: 'id' });
                if (updError) throw updError;
            }

            // 5. Apagar todos custom edges velhos e gravar os novos da tela
            // Pra simplificar, substituimos full replace
            await supabase.from('org_edges').delete().neq('id', 'ignore_all');
            
            if (edgesToCreate && edgesToCreate.length > 0) {
                const { error: edgeError } = await supabase
                    .from('org_edges')
                    .insert(edgesToCreate);
                if (edgeError) throw edgeError;
            }

            return true;
        } catch (error) {
            console.error('Falha crítica ao salvar o mapa:', error);
            throw error;
        }
    }
};
