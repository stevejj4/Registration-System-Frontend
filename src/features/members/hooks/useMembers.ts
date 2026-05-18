/**
 * useMembers is a custom React hook designed to fetch and manage a list of members from an API. It utilizes the useState and useEffect hooks to handle state management and side effects, respectively. 
 * The hook also integrates with a custom useApiCall hook to handle API calls, loading states, and error handling in a standardized way across the application.
 */
import { useState, useEffect } from 'react';
import { memberApi } from '@/api/memberApi';
import { MemberListItemDTO } from '@/types/member';
import { useApiCall } from '@/hooks/useApiCall';

export const useMembers = () => { // 
  const [members, setMembers] = useState<MemberListItemDTO[]>([]);

  const { loading, error, execute: refetch } = useApiCall( // 
    () => memberApi.getAll(),
    (data: MemberListItemDTO[]) => setMembers(data),
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
