import { useState, useEffect } from 'react';
import { memberApi } from '@/api/memberApi';
import { MemberDetails } from '@/types/member';

export const useMemberDetails = (memberId: string) => {
  const [member, setMember] = useState<MemberDetails | null>(null);
  const [loading, setLoading] = useState(true);
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
      const data = await memberApi.getByNationalId(memberId);
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
