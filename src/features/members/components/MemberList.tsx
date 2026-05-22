import React, { useState } from "react";
import { Search, RefreshCw, Edit2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMembers } from "@/features/members";
import { useNavigate, useParams } from "react-router-dom";

interface Props {
  onSelectMember: (id: string) => void;
  selectedId?: string;
}

/**
 * MemberList component displays a searchable and interactive list of members.
 */
export default function MemberList({ onSelectMember, selectedId }: Props) {
  const navigate = useNavigate();
  const { id: routeId } = useParams();

  const { members, loading, error, refetch } = useMembers();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = members.filter((m) =>
    [m.firstName, m.lastName, m.groupName, m.phoneNumber]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const activeId = selectedId ?? routeId;

  const handleSelect = (id: string | number) => {
    if (onSelectMember) {
      onSelectMember(String(id));
    } else {
      navigate(`/members/${id}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Search Bar */}
      <div className="p-6 border-b border-gray-100 flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, group, or phone..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => refetch()}
          className="p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">System ID</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">National ID</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Full Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Registration Date</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Group Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Phone Number</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">
                  Loading principal records...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-red-500 font-medium">{error}</td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">No members found</td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ backgroundColor: "#f9fafb" }}
                  className={`border-b border-gray-100 cursor-pointer transition-colors ${
                    activeId === String(member.id) ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleSelect(member.id)}
                >
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{member.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{member.nationalID}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{member.registrationDate}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{member.groupName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{member.phoneNumber}</td>
                  <td className="px-6 py-4 text-sm text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(member.id);
                      }}
                      className="inline-flex items-center justify-center p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
