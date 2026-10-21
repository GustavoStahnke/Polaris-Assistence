import { displayName, type Profile } from '@polaris/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export const PROFILE_KEY = ['profile'] as const;

/** Perfil do usuário (nome e como a Polaris o chama). */
export function useProfile() {
  const query = useQuery({ queryKey: PROFILE_KEY, queryFn: () => api.get<Profile>('/settings/profile') });
  return { ...query, displayName: displayName(query.data) };
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: Profile) => api.put<Profile>('/settings/profile', profile),
    onSuccess: (profile) => queryClient.setQueryData(PROFILE_KEY, profile),
  });
}
