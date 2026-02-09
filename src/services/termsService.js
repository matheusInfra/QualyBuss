import { supabase } from './supabase';
import { getGeolocation } from '../utils/geo';

export const TERMS_VERSION = '1.0'; // Increment this to force re-acceptance

export const termsService = {
    // Check if user has accepted the current version
    async checkStatus() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data, error } = await supabase
            .from('user_term_acceptances')
            .select('*')
            .eq('user_id', user.id)
            .eq('term_version', TERMS_VERSION)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
            console.error('Error checking terms status:', error);
            return false;
        }

        return !!data;
    },

    // Record acceptance with Geolocation
    async acceptTerms() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        let locationData = null;
        try {
            locationData = await getGeolocation();
        } catch (geoError) {
            console.warn('Geolocation failed, proceeding without it:', geoError);
            // Proceeding is a business decision. For Strict Legal validity, we might block.
            // Here we proceed but log that location was missing.
        }

        // Insert into DB
        const { error } = await supabase
            .from('user_term_acceptances')
            .insert([
                {
                    user_id: user.id,
                    term_version: TERMS_VERSION,
                    accepted_at: new Date().toISOString(),
                    ip_address: 'CLIENT_SIDE_DETECTED', // Real IP should be captured via Edge Function / RLS
                    location: locationData,
                    user_agent: navigator.userAgent
                }
            ]);

        if (error) throw error;
        return true;
    }
};
