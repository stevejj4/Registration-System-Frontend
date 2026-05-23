import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { Users, UserPlus, TrendingUp, Calendar, Activity, RefreshCw } from 'lucide-react';
import { Loading } from '@/components/feedback/Loading';
import { Error } from '@/components/feedback/Error';
import { formatTimeAgo } from '@/utils/dateUtils';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

const ACTIVITY_PAGE_SIZE = 5;

interface DashboardProps {
  onNavigateToRegistration?: () => void;
  onNavigateToMembers?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  onNavigateToRegistration,
  onNavigateToMembers
}) => {
  const { stats, recentActivity, loading, error, refresh } = useDashboard();

  const {
    page: activityPage,
    setPage: setActivityPage,
    paginatedItems: paginatedActivity,
    totalItems: activityTotal,
    totalPages: activityTotalPages,
    rangeStart: activityRangeStart,
    rangeEnd: activityRangeEnd,
  } = usePagination(recentActivity, ACTIVITY_PAGE_SIZE);

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={refresh} />;

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to SUN Welfare Management System</p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="shrink-0 bg-blue-500 rounded-md p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="shrink-0 bg-green-500 rounded-md p-3">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.newThisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="shrink-0 bg-purple-500 rounded-md p-3">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Groups</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeGroups}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="shrink-0 bg-orange-500 rounded-md p-3">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {activityTotal > 0 ? (
              paginatedActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="shrink-0">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.type === 'registration' ? 'bg-green-500' : 
                      activity.type === 'update' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent activity</p>
            )}
          </div>
          {activityTotal > 0 && (
            <Pagination
              page={activityPage}
              totalPages={activityTotalPages}
              totalItems={activityTotal}
              rangeStart={activityRangeStart}
              rangeEnd={activityRangeEnd}
              onPageChange={setActivityPage}
              className="mt-4 rounded-md border border-gray-200 !bg-white"
            />
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <button 
              onClick={onNavigateToRegistration}
              className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center">
                <UserPlus className="h-5 w-5 mr-3" />
                <span className="font-medium">Register New Member</span>
              </div>
            </button>
            <button 
              onClick={onNavigateToMembers}
              className="w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-3" />
                <span className="font-medium">View All Members</span>
              </div>
            </button>
                      </div>
        </div>
      </div>
    </div>
  );
};
