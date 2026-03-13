/**
 * SERVICE: Gestão de Folha e Benefícios
 * MOCK: Simula chamadas ao backend para prototipagem rápida.
 */

import { supabase } from './supabase';



export const payrollService = {
    // 1. Configurações (Taxas) - Busca com suporte a Data de Vigência
    async getSettings(referenceDate = null) {
        try {
            let query = supabase.from('payroll_settings').select('*');

            // Prevenção contra injeção de parâmetros do React Query (QueryFunctionContext)
            let parsedDate = referenceDate;
            if (parsedDate && typeof parsedDate === 'object' && 'queryKey' in parsedDate) {
                parsedDate = null;
            }

            if (parsedDate) {
                const dateStr = typeof parsedDate === 'string' ? parsedDate : parsedDate.toISOString().split('T')[0];
                // Busca a regra válida para a data (vigência)
                query = query
                    .lte('valid_from', dateStr)
                    .or(`valid_until.gte.${dateStr},valid_until.is.null`)
                    .order('valid_from', { ascending: false })
                    .limit(1);
            } else {
                // Fallback para pegar a regra ativa padrão (se não for passada data de competência)
                query = query.eq('active', true).limit(1);
            }

            const { data, error } = await query.maybeSingle();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw error;
            }
            return data;
        } catch (error) {
            console.error('Error fetching settings:', error);
            throw error;
        }
    },

    async updateSettings(newSettings) {
        // Prepare data for Upsert (remove ID if needed, or keep if updating existing)
        // We assume we are updating the active one or creating a new active one
        // Ideally we should have an ID.

        try {
            // First, ensure we have the ID if standard updating
            const payload = {
                ...newSettings,
                active: true,
                updated_at: new Date()
            };

            const { data, error } = await supabase
                .from('payroll_settings')
                .upsert(payload, { onConflict: 'id' }) // If ID is present
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    },

    async assignBenefits({ userId, benefitIds }) {
        try {
            // 1. Inactivate previous benefits? Or just add new ones?
            // Strategy: "Sync". Remove those not in list, add those in list.
            // For MVP/Prototype: simpler approach -> Delete all for user, Insert new.
            // Be careful with CASCADE DELETE or history.

            // Allow "benefit_id" to be null? No.

            // Transaction-like approach (Supabase doesn't support transactions in JS client easily unless via RPC)
            // We'll do:
            // 1. Delete all active benefits for this user
            // 2. Insert selected IPs.

            // A. Fetch existing active benefits
            const { data: currentBenefits, error: fetchError } = await supabase
                .from('collaborator_benefits')
                .select('id, benefit_id')
                .eq('collaborator_id', userId)
                .eq('active', true);

            if (fetchError) throw fetchError;

            const currentBenefitIds = currentBenefits.map(b => b.benefit_id);

            // Determine which to deactivate and which to inject
            const toRemove = currentBenefitIds.filter(id => !benefitIds.includes(id));
            const toAdd = benefitIds.filter(id => !currentBenefitIds.includes(id));

            // B. Inactivate (Soft Delete) removed benefits preserving history
            if (toRemove.length > 0) {
                const { error: updError } = await supabase
                    .from('collaborator_benefits')
                    .update({
                        active: false,
                        end_date: new Date().toISOString()
                    })
                    .eq('collaborator_id', userId)
                    .in('benefit_id', toRemove)
                    .eq('active', true);

                if (updError) throw updError;
            }

            // C. Insert New incoming benefits
            if (toAdd.length > 0) {
                const benefitsToInsert = toAdd.map(bId => ({
                    collaborator_id: userId,
                    benefit_id: bId,
                    active: true,
                    start_date: new Date().toISOString()
                }));

                const { error: insError } = await supabase
                    .from('collaborator_benefits')
                    .insert(benefitsToInsert);

                if (insError) throw insError;
            }

            return { success: true };
        } catch (error) {
            console.error('Error assigning benefits:', error);
            throw error;
        }
    },

    // 2. Benefícios (Catálogo)
    async getBenefitsCatalog() {
        try {
            const { data, error } = await supabase
                .from('benefits_catalog')
                .select('*')
                .eq('active', true)
                .order('name');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching catalog:', error);
            return []; // Fail safe
        }
    },

    async createBenefit(benefit) {
        try {
            const { data, error } = await supabase
                .from('benefits_catalog')
                .insert([{
                    ...benefit,
                    active: true
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating benefit:', error);
            throw error;
        }
    },

    async updateBenefit(id, updates) {
        try {
            const { data, error } = await supabase
                .from('benefits_catalog')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating benefit:', error);
            throw error;
        }
    },

    // 3. Benefícios do Colaborador (Listar o que ele tem)
    async getCollaboratorBenefits(collaboratorId) {
        try {
            // Join with catalog to get names/values
            const { data, error } = await supabase
                .from('collaborator_benefits')
                .select(`
                    *,
                    benefit:benefits_catalog(*)
                `)
                .eq('collaborator_id', collaboratorId)
                .eq('active', true);

            if (error) throw error;

            // Format to match expected UI structure if needed
            // The UI expects { benefit_id, name, value, ... }
            // Our Join returns { benefit_id, benefit: { name, value... } }

            return data.map(item => ({
                ...item.benefit, // Spread catalog details
                ...item,         // Spread assignment details (overrides)
                benefit_id: item.benefit_id // Ensure ID exists
            }));

        } catch (error) {
            console.error('Error fetching user benefits:', error);
            return [];
        }
    },

    // 4. Salvar Simulação (Histórico) - Futuro
    // eslint-disable-next-line no-unused-vars
    async saveSalaryChange(collaboratorId, newSalary, _reason) {
        // Implementation for history log
        try {
            // Fetch current salary first for 'old_salary'? 
            // Assumed passed or handled by backend trigger.
            // Here we update the Collaborator Table mostly.

            const { error } = await supabase
                .from('collaborators')
                .update({ salary: newSalary })
                .eq('id', collaboratorId);

            if (error) throw error;

            // Insert history handled by eventual trigger or manual insert here
            // Manual insert for robustness:
            /*
            await supabase.from('salary_history').insert({
                collaborator_id: collaboratorId,
                new_salary: newSalary,
                change_reason: reason
            });
            */

            return { success: true };
        } catch (error) {
            console.error('Error updating salary:', error);
            throw error;
        }
    },

    // 5. Inicializar Padrões (Seed via Client)
    async initializeDefaults() {
        // [MODIFICAÇÃO DE COMPLIANCE]:
        // As tabelas de INSS e IRRF de 2024 foram removidas do código-fonte (Hardcode)
        // por exigência contábil, pois taxas variam a cada ano e quebram históricos.
        // Toda taxação deve ser inserida agora unicamente pelo DBA ou Tela de Configurações,
        // possuindo 'valid_from' e 'valid_until' explícitos no Supabase.

        throw new Error("A inicialização fixa de taxas via código foi desativada. As faixas de INSS/IRRF devem ser configuradas pela interface administrativa com datas de vigência.");
    },

    // 6. Buscar Colaboradores COM Beneícios (Join) — INCLUI SALARY (modo revelado)
    async getAllCollaboratorsWithBenefits() {
        try {
            // Fetch collaborators
            const { data: collaborators, error: collabError } = await supabase
                .from('collaborators')
                .select('*')
                .order('full_name');

            if (collabError) throw collabError;

            // Fetch benefits
            const { data: benefits, error: benefitsError } = await supabase
                .from('collaborator_benefits')
                .select(`
                    *,
                    benefit:benefits_catalog(*)
                `)
                .eq('active', true);

            if (benefitsError) throw benefitsError;

            const merged = collaborators.map(c => {
                const userBenefits = benefits.filter(b => b.collaborator_id === c.id).map(b => ({
                    ...b.benefit,
                    ...b,
                    benefit_id: b.benefit_id,
                    value: (b.custom_value != null) ? Number(b.custom_value) : Number(b.benefit.value),
                    coparticipation: (b.custom_coparticipation != null) ? Number(b.custom_coparticipation) : Number(b.benefit.default_coparticipation)
                }));
                return {
                    ...c,
                    benefits: userBenefits
                };
            });

            return merged;

        } catch (error) {
            console.error('Error fetching collaborators with benefits:', error);
            return [];
        }
    },

    // 7. Buscar Colaboradores SEM Salary — modo protegido (dados sensíveis não viajam)
    async getAllCollaboratorsPublic() {
        try {
            const { data: collaborators, error: collabError } = await supabase
                .from('collaborators')
                .select('id, full_name, role, department, avatar_url, contract_type, admission_date')
                .order('full_name');

            if (collabError) throw collabError;

            // Benefits (sem salary values individuais — apenas nomes)
            const { data: benefits, error: benefitsError } = await supabase
                .from('collaborator_benefits')
                .select(`
                    collaborator_id,
                    benefit:benefits_catalog(id, name, category)
                `)
                .eq('active', true);

            if (benefitsError) throw benefitsError;

            const merged = collaborators.map(c => {
                const userBenefits = benefits.filter(b => b.collaborator_id === c.id).map(b => ({
                    name: b.benefit?.name,
                    type: b.benefit?.category,
                    value: null  // Explicitamente null — não veio do banco
                }));
                return {
                    ...c,
                    salary: null,  // NÃO TEM no select, garantimos null
                    benefits: userBenefits
                };
            });

            return merged;

        } catch (error) {
            console.error('Error fetching public collaborator data:', error);
            return [];
        }
    },

    // 8. Re-Autenticação de segurança para áreas restritas
    // IMPORTANTE: Usa client ISOLADO para não disparar o enforcement de sessão única
    async reAuthenticate(email, password) {
        const { createClient } = await import('@supabase/supabase-js');
        const tempClient = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
            { auth: { persistSession: false, autoRefreshToken: false } }
        );
        const { error } = await tempClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Descartar o client temp imediatamente
        await tempClient.auth.signOut();
        return true;
    }
};
