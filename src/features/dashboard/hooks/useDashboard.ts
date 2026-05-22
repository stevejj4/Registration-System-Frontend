import { useState, useEffect } from 'react';
import { memberApi } from '@/api/memberApi';
import * as adminApi from '@/api/adminApi'; // ✅ import all exported functions
import { useApiCall } from '@/hooks/useApiCall';
import { useAuth } from "@/hooks/useAuth";

// Types
export interface DashboardStats {
  totalMembers?: number;   // for non-admin roles
  newThisMonth?: number;
  activeGroups?: number;
  pending?: number;
  totalUsers?: number;     // for Admin role
}

export interface RecentActivity {
  id: string;
  type: 'registration' | 'update' | 'group' | 'user';
  description: string;
  timestamp: string;
}

/**
 * Custom hook to manage dashboard data.
 * - Admins see system users (via adminApi).
 * - Coordinators/Facilitators see members (via memberApi).
 * - Exposes stats, recent activity, loading, error, and refresh.
 */
export const useDashboard = () => {
  const { hasRole } = useAuth(); // e.g. 'ADMIN' | 'COORDINATOR' | 'FACILITATOR'

  const [stats, setStats] = useState<DashboardStats>({});
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const { loading, error, execute: fetchData } = useApiCall(
    async () => {
      if (hasRole('ADMIN')) {
        // 🔹 Admin dashboard: fetch system users
        const users = await adminApi.getUsers();
        const totalUsers = users.length;

        const activities: RecentActivity[] = users
          .slice(-5)
          .reverse()
          .map((user: adminApi.SystemUser, index: number) => ({
            id: `user-activity-${index}`,
            type: 'user',
            description: `System user added: ${user.fullName}`,
            timestamp: (user as any).createdAt ?? new Date().toISOString(), // ensure SystemUser has createdAt
          }));

        return {
          stats: { totalUsers },
          activities,
        };
      } else {
        // 🔹 Member dashboard: fetch members
        const members = await memberApi.getAll();

        const totalMembers = members.length;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const newThisMonth = members.filter((member: any) => {
          const regDate = new Date(member.registrationDate);
          return (
            regDate.getMonth() === currentMonth &&
            regDate.getFullYear() === currentYear
          );
        }).length;

        const groups = new Set(members.map((member: any) => member.groupName));
        const activeGroups = groups.size;

        const pending = 0; // placeholder until you add pending logic

        const activities: RecentActivity[] = members
          .slice(-5)
          .reverse()
          .map((member: any, index: number) => ({
            id: `member-activity-${index}`,
            type: 'registration',
            description: `New member registered: ${member.firstName} ${member.lastName}`,
            timestamp: member.registrationDate,
          }));

        return {
          stats: { totalMembers, newThisMonth, activeGroups, pending },
          activities,
        };
      }
    },
    (data: { stats: DashboardStats; activities: RecentActivity[] }) => {
      setStats(data.stats);
      setRecentActivity(data.activities);
    },
    (err) => console.error('Failed to fetch dashboard data:', err)
  );

  // Fetch data on mount and when role changes
  useEffect(() => {
    fetchData();
  }, [hasRole]);

  const refresh = () => {
    fetchData();
  };

  return {
    stats,
    recentActivity,
    loading,
    error,
    refresh,
  };
};
