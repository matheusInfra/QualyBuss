import { supabase } from './supabase';
import { cache } from '../utils/cacheManager';

export const documentService = {
    // Upload file and create record
    async uploadDocument(file, collaboratorId, category = 'Outros') {
        try {
            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop();
            const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
            const filePath = `${collaboratorId}/${Date.now()}_${cleanFileName}.${fileExt}`;

            const { data: storageData, error: storageError } = await supabase.storage
                .from('documentos_pessoais')
                .upload(filePath, file);

            if (storageError) throw storageError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documentos_pessoais')
                .getPublicUrl(filePath);

            // 3. Create Record in Database
            const { data: recordData, error: dbError } = await supabase
                .from('collaborator_documents')
                .insert([
                    {
                        collaborator_id: collaboratorId,
                        name: file.name,
                        url: publicUrl,
                        category: category,
                        size_bytes: file.size,
                        type: file.type
                    }
                ])
                .select()
                .single();

            if (dbError) throw dbError;

            // Invalidate cache for this user's documents
            cache.del(`docs_${collaboratorId}`);

            return recordData;

        } catch (error) {
            console.error('Error in uploadDocument:', error);
            throw error;
        }
    },

    // List documents for a collaborator
    async getByCollaboratorId(collaboratorId) {
        try {
            const cacheKey = `docs_${collaboratorId}`;
            const cached = cache.get(cacheKey);
            if (cached) return cached;

            const { data, error } = await supabase
                .from('collaborator_documents')
                .select('*')
                .eq('collaborator_id', collaboratorId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            cache.set(cacheKey, data, 300); // 5 min cache
            return data;
        } catch (error) {
            console.error('Error getting documents:', error);
            return [];
        }
    },

    // Delete document
    async deleteDocument(id, url) {
        try {
            // 1. Delete from Storage (Logic preserved)
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/documentos_pessoais/');

            if (pathParts.length > 1) {
                const storagePath = pathParts[1];
                const { error: storageError } = await supabase.storage
                    .from('documentos_pessoais')
                    .remove([storagePath]);

                if (storageError) {
                    console.warn("Storage delete warning:", storageError);
                }
            }

            // 2. Delete from Database
            // Get collaborator_id before deleting to invalidate cache correctly (Optional, or just invalidate all docs if needed, but since we pass ID usually we might need to fetch it first if we want strict cache clearing or pass collabID as arg. For simplicity, we might assume the caller re-fetches or we need to invalidate broadly if we don't have collabId. 
            // Better approach: return true, and let UI refetch. But here we want to clear cache.
            // Check if we can get collabID from row?

            // Fetch first to get collab_id for cache clearing
            const { data: doc } = await supabase.from('collaborator_documents').select('collaborator_id').eq('id', id).single();

            const { error: dbError } = await supabase
                .from('collaborator_documents')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            if (doc?.collaborator_id) {
                cache.del(`docs_${doc.collaborator_id}`);
            }

            return true;
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }
};
