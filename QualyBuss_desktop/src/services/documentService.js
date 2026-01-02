import { supabase } from './supabase';

export const documentService = {
    // Upload file and create record
    async uploadDocument(file, collaboratorId, category = 'Outros') {
        try {
            // 1. Upload to Storage
            // Create a unique file path: collaborator_id/timestamp_filename
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

            return recordData;

        } catch (error) {
            console.error('Error in uploadDocument:', error);
            throw error;
        }
    },

    // List documents for a collaborator
    async getByCollaboratorId(collaboratorId) {
        try {
            const { data, error } = await supabase
                .from('collaborator_documents')
                .select('*')
                .eq('collaborator_id', collaboratorId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting documents:', error);
            return [];
        }
    },

    // Delete document
    async deleteDocument(id, url) {
        try {
            // 1. Delete from Storage
            // Extract path from URL. Assuming URL structure allows this. 
            // If publicUrl is "https://.../storage/v1/object/public/bucket/path/to/file"
            // We need "path/to/file".

            const projectUrl = supabase.storageUrl || ''; // fallback if needed, but easier to parse url
            // Simple parse: retrieve everything after 'documentos_pessoais/'
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/documentos_pessoais/');

            if (pathParts.length > 1) {
                const storagePath = pathParts[1];
                const { error: storageError } = await supabase.storage
                    .from('documentos_pessoais')
                    .remove([storagePath]);

                if (storageError) {
                    console.warn("Storage delete warning:", storageError);
                    // We continue to delete the DB record even if storage fails/file not found
                }
            }

            // 2. Delete from Database
            const { error: dbError } = await supabase
                .from('collaborator_documents')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            return true;
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }
};
