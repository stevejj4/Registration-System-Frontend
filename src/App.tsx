/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import MemberList from "./components/MemberList";
import MemberDetails from "./components/MemberDetails";
import MemberRegistration from "./components/MemberRegistration";
import { SystemUser } from "./types/member";
import { motion, AnimatePresence } from "motion/react";
import { UserPlus, LayoutDashboard, Users, Menu, User, ChevronDown } from "lucide-react";

export default function App() {
  const [user] = useState<SystemUser>({
    id: "1",
    fullName: "System User",
    email: "user@example.com",
    role: "facilitator"
  });
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isViewingProfile, setIsViewingProfile] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-500 shadow-xl flex flex-col z-20">
        <div className="p-6 border-b border-blue-400/30">
          <h1 className="text-white text-xl font-bold tracking-tight">SUN Welfare</h1>
        </div>
        
        <nav className="flex-1 mt-6">
          <div 
            className="nav-item"
            onClick={() => { setIsRegistering(false); setSelectedMemberId(null); setIsViewingProfile(false); }}
          >
            <Users className="w-5 h-5 text-gray-200" />
            <span className="font-medium">Member Manager</span>
            <ChevronDown className="w-4 h-4 ml-auto opacity-50" />
          </div>

          <div 
            className={`nav-item active`}
            onClick={() => { setIsRegistering(false); setSelectedMemberId(null); setIsViewingProfile(false); }}
          >
            <span className="ml-8 font-medium">Principal Members</span>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <Menu className="w-6 h-6 text-gray-400 cursor-pointer" />
            <h2 className="text-gray-700 font-semibold text-lg">Member Registration System</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-4 hidden md:block">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{user.role}</p>
              <p className="text-sm font-semibold text-gray-700 leading-none">{user.fullName}</p>
            </div>
            <button 
              onClick={() => { setIsViewingProfile(true); setIsRegistering(false); setSelectedMemberId(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${isViewingProfile ? 'bg-indigo-600 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              <User className="w-4 h-4" /> Profile
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <AnimatePresence mode="wait">
            {isViewingProfile ? (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1"
              >
                <div className="max-w-4xl mx-auto p-8">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">User Profile</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="text-gray-900">{user.fullName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="text-gray-900">{user.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <p className="text-gray-900 capitalize">{user.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsViewingProfile(false)}
                      className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : isRegistering ? (
              <motion.div
                key="registration"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-7xl mx-auto p-8"
              >
                <MemberRegistration 
                  onSuccess={(id) => { setSelectedMemberId(id); setIsRegistering(false); }}
                  onCancel={() => setIsRegistering(false)}
                />
              </motion.div>
            ) : !selectedMemberId ? (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-7xl mx-auto p-8"
              >
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-800">Principal Members</h1>
                  <button 
                    onClick={() => setIsRegistering(true)}
                    className="bg-emerald-500 text-white px-6 py-2.5 rounded-md font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-md"
                  >
                    + Register New Member
                  </button>
                </div>
                <MemberList onSelectMember={setSelectedMemberId} />
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1"
              >
                <MemberDetails 
                  memberId={selectedMemberId} 
                  onBack={() => setSelectedMemberId(null)} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
