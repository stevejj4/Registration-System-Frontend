import { useState, useEffect } from 'react';
import { memberApi } from '@/api/memberApi';
import { MemberListItemDTO } from '@/types/member';
import { useApiCall } from '@/hooks/useApiCall';

//  Dashboard statistics and recent activity types
export interface DashboardStats {
  totalMembers: number;
  newThisMonth: number;
  activeGroups: number;
  pending: number;
}

// Recent activity type
export interface RecentActivity {
  id: string;
  type: 'registration' | 'update' | 'group';
  description: string;
  timestamp: string;
}
// Custom hook to manage dashboard data
export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    newThisMonth: 0,
    activeGroups: 0,
    pending: 0,
  });
 // 
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const { loading, error, execute: fetchMembers } = useApiCall(
    async () => {
      const members = await memberApi.getAll();

      // Calculate statistics
      const totalMembers = members.length;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const newThisMonth = members.filter(member => {
        const regDate = new Date(member.registrationDate);
        return regDate.getMonth() === currentMonth && regDate.getFullYear() === currentYear;
      }).length;

      const groups = new Set(members.map(member => member.groupName));
      const activeGroups = groups.size;

      const pending = 0;

      // Build recent activity
      const activities: RecentActivity[] = members
        .slice(-5)
        .reverse()
        .map((member, index) => ({
          id: `activity-${index}`,
          type: 'registration' as const,
          description: `New member registered: ${member.firstName} ${member.lastName}`,
          timestamp: member.registrationDate,
        }));

      return {
        stats: {
          totalMembers,
          newThisMonth,
          activeGroups,
          pending,
        },
        activities,
      };
    },
    (data: { stats: DashboardStats; activities: RecentActivity[] }) => {
      setStats(data.stats);
      setRecentActivity(data.activities);
    },
    (err) => console.error('Failed to fetch dashboard data:', err)
  );

  useEffect(() => {
    fetchMembers();
  }, []); // Empty dependency array - run only on mount

  const refresh = () => {
    fetchMembers();
  };

  return {
    stats,
    recentActivity,
    loading,
    error,
    refresh,
  };
};
