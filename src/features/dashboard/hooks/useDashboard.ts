import { useState, useEffect } from 'react';
import { memberApi } from '@/api/memberApi';
import * as adminApi from '@/api/adminApi';
import { useApiCall } from '@/hooks/useApiCall';
import { useAuth } from "@/hooks/useAuth";
import { parseApiDate, isSameCalendarMonth } from '@/utils/dateUtils';
import type { MemberListItemDTO } from '@/types/member';

export interface DashboardStats {
  totalMembers?: number;
  newThisMonth?: number;
  activeGroups?: number;
  pending?: number;
  totalUsers?: number;
}

export interface RecentActivity {
  id: string;
  type: 'registration' | 'update' | 'group' | 'user';
  description: string;
  timestamp: string;
}

function toIsoTimestamp(value: unknown): string {
  const parsed = parseApiDate(value);
  return parsed ? parsed.toISOString() : new Date().toISOString();
}

function countNewThisMonth(members: MemberListItemDTO[]): number {
  const now = new Date();
  return members.filter((member) => {
    const reg = parseApiDate(member.registrationDate);
    return reg != null && isSameCalendarMonth(reg, now);
  }).length;
}

function buildMemberActivities(members: MemberListItemDTO[]): RecentActivity[] {
  return [...members]
    .sort((a, b) => {
      const da = parseApiDate(a.registrationDate)?.getTime() ?? 0;
      const db = parseApiDate(b.registrationDate)?.getTime() ?? 0;
      return db - da;
    })
    .map((member) => ({
      id: `member-${member.id}`,
      type: 'registration' as const,
      description: `New member registered: ${member.firstName} ${member.lastName}`,
      timestamp: toIsoTimestamp(member.registrationDate),
    }));
}

export const useDashboard = () => {
  const { hasRole, hasPermission } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({});
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const { loading, error, execute: fetchData } = useApiCall(
    async () => {
      if (hasRole('ADMIN')) {
        const users = await adminApi.getUsers();
        const activities: RecentActivity[] = [...users]
          .sort((a, b) => {
            const da = parseApiDate(a.createdAt)?.getTime() ?? 0;
            const db = parseApiDate(b.createdAt)?.getTime() ?? 0;
            return db - da;
          })
          .map((user) => ({
            id: `user-${user.id}`,
            type: 'user' as const,
            description: `System user: ${user.fullName}`,
            timestamp: toIsoTimestamp(user.createdAt),
          }));

        return {
          stats: { totalUsers: users.length },
          activities,
        };
      }

      if (hasPermission("MEMBER_READ")) {
        const members = await memberApi.getAll();
        const newThisMonth = countNewThisMonth(members);
        const groups = new Set(
          members.map((m) => m.groupName).filter((g) => g && g.trim())
        );

        return {
          stats: {
            totalMembers: members.length,
            newThisMonth,
            activeGroups: groups.size,
            pending: 0,
          },
          activities: buildMemberActivities(members),
        };
      }

      return { stats: {}, activities: [] };
    },
    (data: { stats: DashboardStats; activities: RecentActivity[] }) => {
      setStats(data.stats);
      setRecentActivity(data.activities);
    },
    (err) => console.error('Failed to fetch dashboard data:', err)
  );

  useEffect(() => {
    fetchData();
  }, [hasRole, hasPermission]);

  return {
    stats,
    recentActivity,
    loading,
    error,
    refresh: fetchData,
  };
};
