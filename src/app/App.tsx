/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Dashboard } from "@/features/dashboard";
import { MemberList, MemberDetails, MemberRegistration } from "@/features/members";
import { SystemUser } from "@/types/member";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, Menu, User, ChevronDown, Plus, LogOut, Settings, FileText } from "lucide-react";

type View = 'dashboard' | 'members' | 'register' | 'details';

export default function App() {
  const [user] = useState<SystemUser>({
    id: "1",
    fullName: "System User",
    email: "user@example.com",
    role: "facilitator"
  });
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Icons-only Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-56' : 'w-16'} bg-white border-r border-gray-200 flex flex-col z-20 transition-all duration-300 shadow-sm`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className={`${isSidebarOpen ? 'block' : 'hidden'} text-xl font-bold text-gray-900`}>SUN Welfare</h1>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {/* Main Navigation */}
          <button 
            className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors group ${
              currentView === 'dashboard' && !selectedMemberId
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => {
              setCurrentView('dashboard');
              setSelectedMemberId(null);
            }}
            title="Dashboard"
          >
            <LayoutDashboard className="w-5 h-5" />
            {isSidebarOpen && <span className="ml-3 text-sm font-medium">Dashboard</span>}
          </button>

          <button 
            className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors group ${
              currentView === 'members' && !selectedMemberId
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => {
              setCurrentView('members');
              setSelectedMemberId(null);
            }}
            title="Member Manager"
          >
            <Users className="w-5 h-5" />
            {isSidebarOpen && <span className="ml-3 text-sm font-medium">Member Manager</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {currentView === 'register' ? 'Register New Member' : 
                 currentView === 'details' ? 'Member Details' : 
                 currentView === 'members' ? 'Member Manager' : 'Dashboard'}
              </h1>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-3 text-sm hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {user.fullName.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <AnimatePresence mode="wait">
            {currentView === 'register' ? (
              <motion.div
                key="registration"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="max-w-7xl mx-auto"
              >
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <MemberRegistration 
                    onSuccess={(memberId) => {
                      setCurrentView('details');
                      setSelectedMemberId(memberId);
                    }} 
                    onCancel={() => setCurrentView('members')} 
                  />
                </div>
              </motion.div>
            ) : selectedMemberId ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="max-w-7xl mx-auto"
              >
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <MemberDetails 
                    memberId={selectedMemberId} 
                    onBack={() => {
                      setSelectedMemberId(null);
                      setCurrentView('members');
                    }} 
                  />
                </div>
              </motion.div>
            ) : currentView === 'members' ? (
              <motion.div
                key="members"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="max-w-7xl mx-auto"
              >
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  {/* Member Manager Header */}
                  <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">Member Manager</h1>
                        <p className="text-gray-500 mt-1">Manage members, view details, and register new members</p>
                      </div>
                      <button
                        onClick={() => setCurrentView('register')}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Register Member</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Member List */}
                  <div className="p-6">
                    <MemberList 
                      onSelectMember={(memberId) => {
                        setSelectedMemberId(memberId);
                        setCurrentView('details');
                      }} 
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="max-w-7xl mx-auto"
              >
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <Dashboard 
                    onNavigateToRegistration={() => setCurrentView('register')}
                    onNavigateToMembers={() => setCurrentView('members')}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Action Button */}
      {currentView === 'dashboard' ? (
        <button
          onClick={() => setCurrentView('register')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
          title="Register New Member"
        >
          <Plus className="w-6 h-6" />
          <span className="absolute right-full mr-3 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Register New Member
          </span>
        </button>
      ) : null}
    </div>
  );
}
