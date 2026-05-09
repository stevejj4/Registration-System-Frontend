import { useState, useEffect } from 'react';
import { memberApi } from '@/api/memberApi';
import { MemberListItem } from '@/types/member';
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

  const { loading: statsLoading, error: statsError, execute: fetchStats } = useApiCall(
    async () => {
      const members = await memberApi.getAll();
      
      // Calculate real statistics
      const totalMembers = members.length;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const newThisMonth = members.filter(member => {
        const regDate = new Date(member.registrationDate);
        return regDate.getMonth() === currentMonth && regDate.getFullYear() === currentYear;
      }).length;

      // Get unique groups
      const groups = new Set(members.map(member => member.groupName));
      const activeGroups = groups.size;

      // For now, pending is 0 (could be calculated from a real status field)
      const pending = 0;

      return {
        totalMembers,
        newThisMonth,
        activeGroups,
        pending,
      };
    },
    (data: DashboardStats) => setStats(data),
    (err) => console.error('Failed to fetch dashboard stats:', err)
  );

  const { loading: activityLoading, error: activityError, execute: fetchActivity } = useApiCall(
    async () => {
      const members = await memberApi.getAll();
      
      // Create recent activity from member data
      const activities: RecentActivity[] = members
        .slice(-5)
        .reverse()
        .map((member, index) => ({
          id: `activity-${index}`,
          type: 'registration' as const,
          description: `New member registered: ${member.firstName} ${member.lastName}`,
          timestamp: member.registrationDate,
        }));

      return activities;
    },
    (data: RecentActivity[]) => setRecentActivity(data),
    (err) => console.error('Failed to fetch recent activity:', err)
  );

  useEffect(() => {
    fetchStats();
    fetchActivity();
  }, []); // Empty dependency array - run only on mount

  const refresh = () => {
    fetchStats();
    fetchActivity();
  };

  return {
    stats,
    recentActivity,
    loading: statsLoading || activityLoading,
    error: statsError || activityError,
    refresh,
  };
};
