import React, { useState, useEffect } from "react";
import { memberApi } from "@/api/memberApi";
import { checkBackendConnectivity } from "@/api/client";
import type { MemberDetails, Dependant, NextOfKin } from "@/types/member";
import { ArrowLeft, Edit3, Save, X, Plus, Trash2, User, Users, Heart, ShieldCheck, Mail, Phone, Calendar, Hash, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  memberId: string;
  onBack: () => void;
}

type TabType = "principal" | "nok" | "dependants";

export default function MemberDetails({ memberId, onBack }: Props) {
  const [member, setMember] = useState<MemberDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("principal");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editingDependant, setEditingDependant] = useState<string | null>(null);
  const [dependantFormData, setDependantFormData] = useState<Partial<Dependant>>({});

  const fetchMember = async () => {
    try {
      const data = await memberApi.getById(memberId);
      setMember(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMember();
  }, [memberId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!member || !formData) return;

    try {
      const isBackendConnected = await checkBackendConnectivity();
      if (!isBackendConnected) {
        throw new Error('Server is currently unavailable. Please try again later.');
      }

      if (activeTab === "principal") {
        // Check that all required fields are filled
        if (!formData.principal.firstName.trim() || 
            !formData.principal.lastName.trim() || 
            !formData.principal.nationalID.trim() || 
            !formData.principal.phoneNumber.trim() || 
            !formData.principal.dateOfBirth.trim() ||
            !formData.principal.groupName.trim()) {
          showToast("Please fill in all required fields");
          return;
        }
        // Send the update to the backend
        await memberApi.updatePrincipal(member.id, formData.principal);
        showToast("Principal Info Updated");
      } else if (activeTab === "nok") {
        // Make sure next of kin fields are filled
        if (!formData.firstName.trim() || 
            !formData.lastName.trim() || 
            !formData.relationship.trim() || 
            !formData.idNumber.trim() || 
            !formData.phoneNumber.trim() || 
            !formData.dateOfBirth.trim()) {
          showToast("Please fill in all required fields");
          return;
        }
        // Update next of kin info
        await memberApi.updateNextOfKin(member.id, formData);
        showToast("Next of Kin Updated");
      }
      setEditMode(false);
      setFormData(null);
      fetchMember();
    } catch (error) {
      console.error("Failed to save:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save changes";
      showToast(errorMessage);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    if (activeTab === "principal") {
      setFormData({
        principal: {
          firstName: member?.principal.firstName,
          lastName: member?.principal.lastName,
          nationalID: member?.principal.nationalID,
          phoneNumber: member?.principal.phoneNumber,
          dateOfBirth: member?.principal.dateOfBirth,
          groupName: member?.principal.groupName,
        },
      });
    } else if (activeTab === "nok") {
      // Load next of kin data into the form
      setFormData({
        firstName: member?.nextOfKin?.firstName || "",
        lastName: member?.nextOfKin?.lastName || "",
        relationship: member?.nextOfKin?.relationship || "",
        idNumber: member?.nextOfKin?.idNumber || "",
        phoneNumber: member?.nextOfKin?.phoneNumber || "",
        dateOfBirth: member?.nextOfKin?.dateOfBirth || "",
      });
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData(null);
  };

  const handleAddDependant = async (data: Omit<Dependant, "id">) => {
    if (!member) return;
    try {
      const isBackendConnected = await checkBackendConnectivity();
      if (!isBackendConnected) {
        throw new Error('Server is currently unavailable. Please try again later.');
      }
      
      await memberApi.addDependant(member.id, data);
      showToast("Dependant Added");
      fetchMember();
    } catch (error) {
      console.error("Failed to add dependant:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add dependant";
      showToast(errorMessage);
    }
  };

  const handleUpdateDependant = async (dependantId: string, data: Partial<Dependant>) => {
    try {
      const isBackendConnected = await checkBackendConnectivity();
      if (!isBackendConnected) {
        throw new Error('Server is currently unavailable. Please try again later.');
      }
      
      await memberApi.updateDependant(dependantId, data);
      showToast("Dependant Updated");
      fetchMember();
    } catch (error) {
      console.error("Failed to update dependant:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update dependant";
      showToast(errorMessage);
    }
  };

  const handleDeleteDependant = async (dependantId: string) => {
    if (!member) return;
    try {
      const isBackendConnected = await checkBackendConnectivity();
      if (!isBackendConnected) {
        throw new Error('Server is currently unavailable. Please try again later.');
      }
      
      await memberApi.deleteDependant(member.id, dependantId);
      showToast("Dependant Deleted");
      fetchMember();
    } catch (error) {
      console.error("Failed to delete dependant:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete dependant";
      showToast(errorMessage);
    }
  };

  const handleEditDependant = (dependant: Dependant) => {
    setEditingDependant(dependant.id);
    setDependantFormData(dependant);
  };

  const handleSaveDependant = async (dependantId: string) => {
    try {
      await memberApi.updateDependant(dependantId, dependantFormData);
      showToast("Dependant Updated");
      setEditingDependant(null);
      setDependantFormData({});
      fetchMember();
    } catch (error) {
      console.error("Failed to update dependant:", error);
      showToast("Failed to update dependant");
    }
  };

  const handleCancelEditDependant = () => {
    setEditingDependant(null);
    setDependantFormData({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading member details...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Member not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to List
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {member.principal.firstName} {member.principal.lastName}
            </h1>
            <p className="text-gray-600">ID: {member.principal.nationalID}</p>
          </div>
          {!editMode && (
            <button
              onClick={handleEdit}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          {[
            { id: "principal", label: "Principal Details", icon: User },
            { id: "nok", label: "Next of Kin", icon: Heart },
            { id: "dependants", label: `Dependants (${member.dependants.length})`, icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "principal" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Principal Information</h2>
            {editMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      value={formData?.principal?.firstName || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          principal: {
                            ...formData.principal,
                            firstName: e.target.value,
                          },
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      value={formData?.principal?.lastName || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          principal: {
                            ...formData.principal,
                            lastName: e.target.value,
                          },
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">National ID</label>
                    <input
                      type="text"
                      value={formData?.principal?.nationalID || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          principal: {
                            ...formData.principal,
                            nationalID: e.target.value,
                          },
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      value={formData?.principal?.phoneNumber || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          principal: {
                            ...formData.principal,
                            phoneNumber: e.target.value,
                          },
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      value={formData?.principal?.dateOfBirth || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          principal: {
                            ...formData.principal,
                            dateOfBirth: e.target.value,
                          },
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Group Name</label>
                    <input
                      type="text"
                      value={formData?.principal?.groupName || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          principal: {
                            ...formData.principal,
                            groupName: e.target.value,
                          },
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2 inline" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <p className="mt-1 text-gray-900">{member.principal.firstName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <p className="mt-1 text-gray-900">{member.principal.lastName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">National ID</label>
                    <p className="mt-1 text-gray-900">{member.principal.nationalID}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <p className="mt-1 text-gray-900">{member.principal.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <p className="mt-1 text-gray-900">{member.principal.dateOfBirth}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Group Name</label>
                    <p className="mt-1 text-gray-900">{member.principal.groupName}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "nok" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Next of Kin Information</h2>
            {editMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      value={formData?.firstName || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      value={formData?.lastName || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Relationship</label>
                    <input
                      type="text"
                      value={formData?.relationship || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, relationship: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID Number</label>
                    <input
                      type="text"
                      value={formData?.idNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, idNumber: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      value={formData?.phoneNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, phoneNumber: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      value={formData?.dateOfBirth || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, dateOfBirth: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2 inline" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {member.nextOfKin ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <p className="mt-1 text-gray-900">{member.nextOfKin.firstName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <p className="mt-1 text-gray-900">{member.nextOfKin.lastName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Relationship</label>
                      <p className="mt-1 text-gray-900">{member.nextOfKin.relationship}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ID Number</label>
                      <p className="mt-1 text-gray-900">{member.nextOfKin.idNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <p className="mt-1 text-gray-900">{member.nextOfKin.phoneNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                      <p className="mt-1 text-gray-900">{member.nextOfKin.dateOfBirth}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No next of kin information available
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "dependants" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Dependants</h2>
              <button
                onClick={() => {
                  // Start with empty form data for user to fill in
                  setEditingDependant("new");
                  setDependantFormData({
                    firstName: "",
                    lastName: "",
                    relationship: "",
                    gender: "",
                    phoneNumber: "",
                    dateOfBirth: "",
                  });
                }}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Dependant
              </button>
            </div>
            {member.dependants.length > 0 ? (
              <div className="space-y-4">
                {member.dependants.map((dependant) => (
                  <div
                    key={dependant.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    {editingDependant === dependant.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            <input
                              type="text"
                              value={dependantFormData.firstName || ""}
                              onChange={(e) => setDependantFormData({ ...dependantFormData, firstName: e.target.value })}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                              type="text"
                              value={dependantFormData.lastName || ""}
                              onChange={(e) => setDependantFormData({ ...dependantFormData, lastName: e.target.value })}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Relationship</label>
                            <select
                              value={dependantFormData.relationship || ""}
                              onChange={(e) => setDependantFormData({ ...dependantFormData, relationship: e.target.value })}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select relationship</option>
                              <option value="Son">Son</option>
                              <option value="Daughter">Daughter</option>
                              <option value="Spouse">Spouse</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Gender</label>
                            <select
                              value={dependantFormData.gender || ""}
                              onChange={(e) => setDependantFormData({ ...dependantFormData, gender: e.target.value })}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                            <input
                              type="tel"
                              value={dependantFormData.phoneNumber || ""}
                              onChange={(e) => setDependantFormData({ ...dependantFormData, phoneNumber: e.target.value })}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                            <input
                              type="date"
                              value={dependantFormData.dateOfBirth || ""}
                              onChange={(e) => setDependantFormData({ ...dependantFormData, dateOfBirth: e.target.value })}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={handleCancelEditDependant}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveDependant(dependant.id!)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="font-medium text-gray-900">
                            {dependant.firstName} {dependant.lastName}
                          </h3>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Relationship:</span>
                              <span className="ml-2 text-gray-900">{dependant.relationship}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Gender:</span>
                              <span className="ml-2 text-gray-900">{dependant.gender}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Phone:</span>
                              <span className="ml-2 text-gray-900">{dependant.phoneNumber}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Date of Birth:</span>
                              <span className="ml-2 text-gray-900">{dependant.dateOfBirth}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditDependant(dependant)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDependant(dependant.id!)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No dependants added yet
              </div>
            )}
            
            {/* New Dependant Form */}
            {editingDependant === "new" && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="font-medium text-gray-900 mb-4">Add New Dependant</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={dependantFormData.firstName || ""}
                        onChange={(e) => setDependantFormData({ ...dependantFormData, firstName: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={dependantFormData.lastName || ""}
                        onChange={(e) => setDependantFormData({ ...dependantFormData, lastName: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter last name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Relationship</label>
                      <select
                        value={dependantFormData.relationship || ""}
                        onChange={(e) => setDependantFormData({ ...dependantFormData, relationship: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select relationship</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Spouse">Spouse</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <select
                        value={dependantFormData.gender || ""}
                        onChange={(e) => setDependantFormData({ ...dependantFormData, gender: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        type="tel"
                        value={dependantFormData.phoneNumber || ""}
                        onChange={(e) => setDependantFormData({ ...dependantFormData, phoneNumber: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                      <input
                        type="date"
                        value={dependantFormData.dateOfBirth || ""}
                        onChange={(e) => setDependantFormData({ ...dependantFormData, dateOfBirth: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleCancelEditDependant}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAddDependant(dependantFormData as Omit<Dependant, "id">)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Add Dependant
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
