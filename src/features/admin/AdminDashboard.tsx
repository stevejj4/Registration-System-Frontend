import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { hasRole } = useAuth() as any;
  const isAdmin = hasRole && hasRole('ADMIN');

  const adminTasks = [
    {
      id: 'users',
      title: 'Manage Users',
      description: 'View, edit, and delete system users. Manage user roles and permissions.',
      icon: '👥',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      onClick: () => navigate('/admin/users'),
    },
    {
      id: 'members',
      title: 'Member Oversight',
      description: 'Review member registrations and manage member data across the system.',
      icon: '📋',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      onClick: () => navigate('/members'),
    },
    {
      id: 'reports',
      title: 'System Reports',
      description: 'Generate and view system reports, analytics, and audit logs.',
      icon: '📊',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      onClick: () => alert('Reports feature coming soon'),
    },
    {
      id: 'settings',
      title: 'System Settings',
      description: 'Configure system preferences, email settings, and backup options.',
      icon: '⚙️',
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      onClick: () => alert('Settings feature coming soon'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <p className="text-gray-600 mt-2">Administrative tools are available here.</p>
        {/* Admin Tasks Grid */}
        {isAdmin ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminTasks.map((task) => (
              <button
                key={task.id}
                onClick={task.onClick}
                className={`border-2 rounded-lg p-6 text-left transition-all duration-200 hover:shadow-md ${task.color}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{task.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-600 mt-2">{task.description}</p>
                    <div className="mt-4">
                      <span className="text-sm font-medium text-blue-600 hover:text-blue-700">Access →</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
            <h3 className="text-lg font-semibold">Admin access required</h3>
            <p className="text-sm text-gray-700 mt-2">
              You do not have administrator privileges. If you believe this is an error,
              contact a system administrator to request elevated access.
            </p>
            <div className="mt-4">
              <button onClick={() => navigate('/')} className="px-3 py-2 bg-gray-100 border rounded">Return to dashboard</button>
            </div>
          </div>
        )}
        <div className="mt-6 space-x-2">
          <button onClick={() => navigate('/admin/users')} className="px-4 py-2 bg-blue-500 text-white rounded">Manage Users</button>
        </div>
      </div>
    </div>
  );
}
