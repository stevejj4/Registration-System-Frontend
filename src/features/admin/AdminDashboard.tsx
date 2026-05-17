import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <p className="text-gray-600 mt-2">Administrative tools are available here.</p>
        <div className="mt-6 space-x-2">
          <button onClick={() => navigate('/admin/users')} className="px-4 py-2 bg-blue-500 text-white rounded">Manage Users</button>
        </div>
      </div>
    </div>
  );
}
