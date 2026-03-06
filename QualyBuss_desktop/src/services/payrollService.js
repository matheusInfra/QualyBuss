/**
 * SERVICE: Gestão de Folha e Benefícios
 * MOCK: Simula chamadas ao backend para prototipagem rápida.
 */

import { supabase } from './supabase';



export const payrollService = {
    // 1. Configurações (Taxas)
    async getSettings() {
        try {
            const { data, error } = await supabase
                .from('payroll_settings')
                .select('*')
                .eq('active', true)
                .single();

            if (error) {
                // If no settings found (first run), return default null or handle gracefuly
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

            // A. Delete existing (Active)
            const { error: delError } = await supabase
                .from('collaborator_benefits')
                .delete()
                .eq('collaborator_id', userId);

            if (delError) throw delError;

            // B. Insert New
            if (benefitIds.length > 0) {
                const benefitsToInsert = benefitIds.map(bId => ({
                    collaborator_id: userId,
                    benefit_id: bId,
                    active: true
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
    async saveSalaryChange(collaboratorId, newSalary, reason) {
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
        try {
            // INSS 2024
            const inss_brackets = [
                { limit: 1412.00, rate: 0.075, deduction: 0 },
                { limit: 2666.68, rate: 0.09, deduction: 21.18 },
                { limit: 4000.03, rate: 0.12, deduction: 101.18 },
                { limit: 7786.02, rate: 0.14, deduction: 181.18 }
            ];
            // IRRF 2024
            const irrf_brackets = [
                { limit: 2259.20, rate: 0, deduction: 0 },
                { limit: 2826.65, rate: 0.075, deduction: 169.44 },
                { limit: 3751.05, rate: 0.15, deduction: 381.44 },
                { limit: 4664.68, rate: 0.225, deduction: 662.77 },
                { limit: 9999999, rate: 0.275, deduction: 896.00 }
            ];

            const payload = {
                active: true,
                inss_brackets,
                irrf_brackets,
                company_taxes: { fgts: 0.08, provision_vacation: 0.1111, provision_13th: 0.0833 },
                dependant_deduction: 189.59
            };

            const { data, error } = await supabase
                .from('payroll_settings')
                .upsert(payload, { onConflict: 'active' }) // Assuming generic conflict resolution or just insert
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error initializing defaults:', error);
            throw error;
        }
    },

    // 6. Buscar Colaboradores COM Benefícios (Join)
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

            // Merge in memory (avoiding complex joins for now if RLS is tricky on joins)
            // Or simpler: Return joined structure if the above Supabase Select supports it well.
            // Let's do in-memory merge to be robust against "User sees ALL benefits vs User sees HIS benefits" RLS.
            // Since this is for the DASHBOARD (admin), we likely got all benefits.

            const merged = collaborators.map(c => {
                const userBenefits = benefits.filter(b => b.collaborator_id === c.id).map(b => ({
                    ...b.benefit,
                    ...b,
                    benefit_id: b.benefit_id,
                    // FIX: Ensure custom_value logic applies (the spread above overwrites value with custom_value if custom_value is the key, but here the keys are DIFFERENT: value (catalog) vs custom_value (link))
                    // The UI expects 'value'. So we must set 'value' to equal custom_value if it exists.
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
    }
};
