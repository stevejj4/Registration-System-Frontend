import React, { useState, useEffect, useCallback, useMemo } from "react";
import { memberApi } from "@/api/memberApi";
import { checkBackendConnectivity } from "@/api/client";
import type {
  MemberDetailsDTO,
  Dependant,
  NextOfKinDTO,
  PrincipalMemberDTO,
} from "@/types/member";
import { ArrowLeft, Edit3, Save, Plus, Trash2, User, Users, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { Button } from "@/components/ui/Button";
import HasRole from "@/components/HasRole";
import HasPermission from "@/components/HasPermission";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/types/permissions";
import { tryValidateId, validateId } from "@/utils/apiValidation";
import {
  relationshipToDisplayText,
  genderToDisplayText,
  displayTextToRelationship,
} from "@/utils/helpers";

interface Props {
  memberId: string;
  onBack: () => void;
}

type TabType = "principal" | "nok" | "dependants";

type PrincipalFormState = {
  principal: {
    firstName: string;
    lastName: string;
    nationalID: string;
    phoneNumber: string;
    dateOfBirth: string;
    groupName: string;
    gender: PrincipalMemberDTO["gender"];
  };
};

type NokFormState = {
  firstName: string;
  lastName: string;
  relationship: string;
  idNumber: string;
  phoneNumber: string;
  dateOfBirth: string;
};

/**
 * MemberDetails component displays detailed information about a specific member, including their principal details, next of kin, and dependants.
 * It allows editing of principal and next of kin information, as well as adding, editing, and deleting dependants. 
 * The component also handles API interactions for updating member data and provides user feedback through toast notifications.
 * Key features: -- 
 * - Tabbed interface for organizing member information
 * - Edit mode with form validation for principal and next of kin details\
 * - Dependant management with add, edit, and delete functionality
 * - API connectivity checks before performing updates
 * - User feedback through toast notifications for successful updates and error handling
 * This component is a central part of the member management system, providing a comprehensive view and management interface for individual members.
 */

export default function MemberDetails({ memberId, onBack }: Props) {
  const { hasRole } = useAuth();
  const canManageKinAndDependants =
    hasRole("COORDINATOR") || hasRole("ADMIN");
  const routeMemberId = useMemo(() => tryValidateId(memberId), [memberId]);

  const [member, setMember] = useState<MemberDetailsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("principal");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<
    PrincipalFormState | NokFormState | null
  >(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editingDependant, setEditingDependant] = useState<string | null>(null);
  const [dependantFormData, setDependantFormData] = useState<Partial<Dependant>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"member" | "nok" | null>(null);

  const resolvePrincipalId = useCallback((): number | null => {
    const fromPrincipal = tryValidateId(member?.principal?.id);
    return fromPrincipal ?? routeMemberId;
  }, [member?.principal?.id, routeMemberId]);

  const requirePrincipalId = useCallback((): number => {
    const id = resolvePrincipalId();
    return validateId(id, "principal member ID");
  }, [resolvePrincipalId]);

  const fetchMember = useCallback(async () => {
    if (!routeMemberId) {
      setLoadError("Invalid member ID in URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const data = await memberApi.getById(routeMemberId);
      setMember(data);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load member details"
      );
    } finally {
      setLoading(false);
    }
  }, [routeMemberId]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!member || !formData) return;

    let principalId: number;
    try {
      principalId = requirePrincipalId();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Invalid member ID");
      return;
    }

    try {
      const isBackendConnected = await checkBackendConnectivity();
      if (!isBackendConnected) {
        throw new Error(
          "Server is currently unavailable. Please try again later."
        );
      }

      if (activeTab === "principal" && "principal" in formData) {
        const p = formData.principal;
        if (
          !p.firstName.trim() ||
          !p.lastName.trim() ||
          !p.nationalID.trim() ||
          !p.phoneNumber.trim() ||
          !p.dateOfBirth.trim() ||
          !p.groupName.trim()
        ) {
          showToast("Please fill in all required fields");
          return;
        }

        const updated = await memberApi.updatePrincipal(
          principalId,
          { ...member.principal, ...p },
          member
        );
        setMember(updated);
        showToast("Principal Info Updated");
      } else if (activeTab === "nok" && "firstName" in formData) {
        const nok = formData;
        if (
          !nok.firstName.trim() ||
          !nok.lastName.trim() ||
          !nok.relationship.trim() ||
          !nok.idNumber.trim() ||
          !nok.phoneNumber.trim() ||
          !nok.dateOfBirth.trim()
        ) {
          showToast("Please fill in all required fields");
          return;
        }

        const payload: Partial<NextOfKinDTO> = {
          ...member.nextOfKin,
          firstName: nok.firstName.trim(),
          lastName: nok.lastName.trim(),
          relationship: displayTextToRelationship(nok.relationship),
          idNumber: nok.idNumber.trim(),
          phoneNumber: nok.phoneNumber.trim(),
          dateOfBirth: nok.dateOfBirth.trim(),
          gender: member.nextOfKin?.gender ?? "OTHER",
        };

        const updated = await memberApi.patchNextOfKin(principalId, payload, member);
        setMember(updated);
        showToast("Next of Kin Updated");
      }

      setEditMode(false);
      setFormData(null);
    } catch (error) {
      console.error("Failed to save:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to save changes"
      );
    }
  };

  const handleEdit = () => {
    if (!member) return;
    setEditMode(true);

    if (activeTab === "principal") {
      setFormData({
        principal: {
          firstName: member.principal.firstName ?? "",
          lastName: member.principal.lastName ?? "",
          nationalID: member.principal.nationalID ?? "",
          phoneNumber: member.principal.phoneNumber ?? "",
          dateOfBirth: member.principal.dateOfBirth ?? "",
          groupName: member.principal.groupName ?? "",
          gender: member.principal.gender,
        },
      });
    } else if (activeTab === "nok" && member.nextOfKin) {
      setFormData({
        firstName: member.nextOfKin.firstName ?? "",
        lastName: member.nextOfKin.lastName ?? "",
        relationship: relationshipToDisplayText(member.nextOfKin.relationship),
        idNumber: member.nextOfKin.idNumber ?? "",
        phoneNumber: member.nextOfKin.phoneNumber ?? "",
        dateOfBirth: member.nextOfKin.dateOfBirth ?? "",
      });
    }
  };

  const openDeleteMemberModal = () => {
    setConfirmType("member");
    setConfirmOpen(true);
  };

  const openDeleteNokModal = () => {
    setConfirmType("nok");
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!member || !confirmType) return;

    let principalId: number;
    try {
      principalId = requirePrincipalId();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Invalid member ID");
      setConfirmOpen(false);
      return;
    }

    try {
      const isBackendConnected = await checkBackendConnectivity();
      if (!isBackendConnected) {
        throw new Error(
          "Server is currently unavailable. Please try again later."
        );
      }

      if (confirmType === "member") {
        await memberApi.deleteMember(principalId);
        showToast("Member Deleted");
        setConfirmOpen(false);
        onBack();
        return;
      }

      if (confirmType === "nok") {
        const updated = await memberApi.deleteNextOfKin(principalId, member);
        setMember(updated);
        showToast("Next of Kin Deleted");
        setConfirmOpen(false);
        return;
      }
    } catch (error) {
      console.error("Delete action failed:", error);
      showToast(error instanceof Error ? error.message : "Delete failed");
      setConfirmOpen(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData(null);
  };

  const handleAddDependant = async (data: Omit<Dependant, "id">) => {
    if (!member) return;
    try {
      const principalId = requirePrincipalId();
      const isBackendConnected = await checkBackendConnectivity();
      if (!isBackendConnected) {
        throw new Error(
          "Server is currently unavailable. Please try again later."
        );
      }

      const updated = await memberApi.addDependant(principalId, data, member);
      setMember(updated);
      showToast("Dependant Added");
    } catch (error) {
      console.error("Failed to add dependant:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to add dependant"
      );
    }
  };

  const handleDeleteDependant = async (dependantId: string) => {
    if (!member) return;
    try {
      const principalId = requirePrincipalId();
      const isBackendConnected = await checkBackendConnectivity();
      if (!isBackendConnected) {
        throw new Error(
          "Server is currently unavailable. Please try again later."
        );
      }

      const updated = await memberApi.deleteDependant(principalId, dependantId, member);
      setMember(updated);
      showToast("Dependant Deleted");
    } catch (error) {
      console.error("Failed to delete dependant:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to delete dependant"
      );
    }
  };

  const handleEditDependant = (dependant: Dependant) => {
    setEditingDependant(dependant.id);
    setDependantFormData(dependant);
  };

  const handleSaveDependant = async (dependantId: string) => {
    if (!member) return;
    try {
      const principalId = requirePrincipalId();
      const updated = await memberApi.patchDependant(
        principalId,
        dependantId,
        dependantFormData,
        member
      );
      setMember(updated);
      showToast("Dependant Updated");
      setEditingDependant(null);
      setDependantFormData({});
    } catch (error) {
      console.error("Failed to update dependant:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to update dependant"
      );
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

  if (!routeMemberId || loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-gray-600">
          {loadError ?? "Invalid member link. Return to the list and try again."}
        </p>
        <Button onClick={onBack} variant="outline">
          Back to List
        </Button>
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

  const principalForm =
    formData && "principal" in formData ? formData : null;
  const nokForm = formData && "firstName" in formData ? formData : null;

  const tabs: { id: TabType; label: string; icon: typeof User }[] = [
    { id: "principal", label: "Principal Details", icon: User },
    {
      id: "nok",
      label: "Next of Kin",
      icon: Heart,
    },
    {
      id: "dependants",
      label: `Dependants (${member.dependants.length})`,
      icon: Users,
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button onClick={onBack} variant="outline" size="md" className="flex items-center mb-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to List
        </Button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {member.principal.firstName} {member.principal.lastName}
            </h1>
            <p className="text-gray-600">ID: {member.principal.nationalID}</p>
          </div>
          {!editMode && (
            <div className="flex space-x-2">
              <HasPermission permissions={PERMISSIONS.MEMBER_WRITE}>
                {activeTab === "principal" && (
                  <Button onClick={handleEdit} variant="primary" size="md">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </HasPermission>
              {canManageKinAndDependants && (
                <>
                  {activeTab === "nok" && member.nextOfKin && (
                    <Button onClick={handleEdit} variant="primary" size="md">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </>
              )}
              <HasRole roles={["ADMIN"]}>
                <Button
                  onClick={openDeleteMemberModal}
                  variant="danger"
                  size="md"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Member
                </Button>
              </HasRole>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
                      value={principalForm?.principal.firstName ?? ""}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev && "principal" in prev
                            ? {
                                ...prev,
                                principal: {
                                  ...prev.principal,
                                  firstName: e.target.value,
                                },
                              }
                            : prev
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      value={principalForm?.principal.lastName ?? ""}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev && "principal" in prev
                            ? {
                                ...prev,
                                principal: {
                                  ...prev.principal,
                                  lastName: e.target.value,
                                },
                              }
                            : prev
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">National ID</label>
                    <input
                      type="text"
                      value={principalForm?.principal.nationalID ?? ""}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev && "principal" in prev
                            ? {
                                ...prev,
                                principal: {
                                  ...prev.principal,
                                  nationalID: e.target.value,
                                },
                              }
                            : prev
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      value={principalForm?.principal.phoneNumber ?? ""}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev && "principal" in prev
                            ? {
                                ...prev,
                                principal: {
                                  ...prev.principal,
                                  phoneNumber: e.target.value,
                                },
                              }
                            : prev
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      value={principalForm?.principal.dateOfBirth ?? ""}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev && "principal" in prev
                            ? {
                                ...prev,
                                principal: {
                                  ...prev.principal,
                                  dateOfBirth: e.target.value,
                                },
                              }
                            : prev
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Group Name</label>
                    <input
                      type="text"
                      value={principalForm?.principal.groupName ?? ""}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev && "principal" in prev
                            ? {
                                ...prev,
                                principal: {
                                  ...prev.principal,
                                  groupName: e.target.value,
                                },
                              }
                            : prev
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <Button onClick={handleCancel} variant="outline" size="md">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} variant="primary" size="md">
                    <Save className="w-4 h-4 mr-2 inline" />
                    Save
                  </Button>
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
                      value={nokForm?.firstName ?? ""}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev && "firstName" in prev
                            ? { ...prev, firstName: e.target.value }
                            : prev
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      value={nokForm?.lastName ?? ""}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev && "firstName" in prev
                            ? { ...prev, lastName: e.target.value }
                            : prev
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Relationship</label>
                    <input
                      type="text"
                      value={nokForm?.relationship ?? ""}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev && "firstName" in prev
                            ? { ...prev, relationship: e.target.value }
                            : prev
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID Number</label>
                    <input
                      type="text"
                      value={nokForm?.idNumber ?? ""}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev && "firstName" in prev
                            ? { ...prev, idNumber: e.target.value }
                            : prev
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      value={nokForm?.phoneNumber ?? ""}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev && "firstName" in prev
                            ? { ...prev, phoneNumber: e.target.value }
                            : prev
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      value={nokForm?.dateOfBirth ?? ""}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev && "firstName" in prev
                            ? { ...prev, dateOfBirth: e.target.value }
                            : prev
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <Button onClick={handleCancel} variant="outline" size="md">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} variant="primary" size="md">
                    <Save className="w-4 h-4 mr-2 inline" />
                    Save
                  </Button>
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
                  <></>
                )}
                {member.nextOfKin && !editMode && canManageKinAndDependants && (
                  <div className="mt-4 flex justify-end">
                    <Button onClick={openDeleteNokModal} variant="danger" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Next of Kin
                    </Button>
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
              {canManageKinAndDependants && (
              <Button
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
                variant="primary"
                size="md"
                className="flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Dependant
              </Button>
              )}
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
                          <Button onClick={handleCancelEditDependant} variant="outline" size="md">
                            Cancel
                          </Button>
                          <Button onClick={() => handleSaveDependant(dependant.id!)} variant="primary" size="md">
                            Save
                          </Button>
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
                        {canManageKinAndDependants && (
                        <div className="flex space-x-2">
                          <Button onClick={() => handleEditDependant(dependant)} variant="outline" size="sm">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => handleDeleteDependant(dependant.id!)} variant="danger" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        )}
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
            {canManageKinAndDependants && editingDependant === "new" && (
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
                    <Button onClick={handleCancelEditDependant} variant="outline" size="md">
                      Cancel
                    </Button>
                    <Button onClick={() => handleAddDependant(dependantFormData as Omit<Dependant, "id">)} variant="primary" size="md">
                      Add Dependant
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmOpen}
        title={confirmType === "member" ? "Delete Member" : "Delete Next of Kin"}
        message={
          confirmType === "member"
            ? "Deleting this principal member will also remove their next of kin and dependants. This action cannot be undone. Are you sure?"
            : "Delete the next of kin for this member? This cannot be undone."
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
        confirmText="Delete"
        cancelText="Cancel"
      />

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
