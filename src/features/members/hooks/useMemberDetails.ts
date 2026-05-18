/**
 * useMemberDetails is a custom React hook designed to fetch and manage the details of a specific member based on their ID. It provides an easy way to retrieve member information, handle loading states, and manage errors.
 * The hook also includes a refetch function that allows components to re-fetch the member details on demand, making it useful for scenarios where member information may change and needs to be updated in the UI.
 * - memberId: The unique identifier of the member whose details are to be fetched. This is a required parameter for the hook to function correctly.
 * - member: The state variable that holds the fetched member details. It is of type MemberDetails or null if no data has been fetched yet.
 */
import { useState, useEffect } from 'react';
import { memberApi } from '@/api/memberApi';
import { MemberDetailsDTO } from '@/types/member';

export const useMemberDetails = (memberId: string) => {
  const [member, setMember] = useState<MemberDetailsDTO | null>(null);
  const [loading, setLoading] = useState(true); // 
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    if (!memberId) {
      setError('Member ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await memberApi.getById(Number(memberId));
      setMember(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch member details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [memberId]);

  return {
    member,
    loading,
    error,
    refetch,
  };
};
