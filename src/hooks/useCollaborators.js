import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collaboratorService } from '../services/collaboratorService';

export const useCollaborators = (filters = { page: 1, limit: 30, status: 'active', searchTerm: '' }) => {
    return useQuery({
        queryKey: ['collaborators', filters],
        queryFn: () => collaboratorService.getPaginated(filters),
        keepPreviousData: true, // Useful for pagination
    });
};

export const useCollaboratorMutations = () => {
    const queryClient = useQueryClient();

    const invalidateCollaborators = () => {
        queryClient.invalidateQueries(['collaborators']);
    };

    const createCollaborator = useMutation({
        mutationFn: (data) => collaboratorService.create(data),
        onSuccess: invalidateCollaborators,
    });

    const updateCollaborator = useMutation({
        mutationFn: ({ id, data }) => collaboratorService.update(id, data),
        onSuccess: invalidateCollaborators,
    });

    const toggleStatus = useMutation({
        mutationFn: ({ id, currentStatus }) => collaboratorService.toggleStatus(id, currentStatus),
        onSuccess: invalidateCollaborators,
    });

    return {
        createCollaborator,
        updateCollaborator,
        toggleStatus,
    };
};
