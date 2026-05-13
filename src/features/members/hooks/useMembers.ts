import { useState, useEffect } from 'react';
import { memberApi } from '@/api/memberApi';
import { MemberListItem } from '@/types/member';
import { useApiCall } from '@/hooks/useApiCall';

export const useMembers = () => {
  const [members, setMembers] = useState<MemberListItem[]>([]);

  const { loading, error, execute: refetch } = useApiCall(
    () => memberApi.getAll(),
    (data: MemberListItem[]) => setMembers(data),
    (err) => console.error('Failed to fetch members:', err)
  );

  useEffect(() => {
    refetch();
  }, []);

  return {
    members,
    loading,
    error,
    refetch,
  };
};
