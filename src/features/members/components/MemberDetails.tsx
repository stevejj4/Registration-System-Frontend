import React, { useState, useEffect, useCallback, useMemo } from "react";
import { locationApi } from "@/api/locationApi";
import { memberApi } from "@/api/memberApi";
import { memberTransferApi } from "@/api/memberTransferApi";
import { checkBackendConnectivity } from "@/api/client";
import type {
  MemberDetailsDTO,
  Dependant,
  NextOfKinDTO,
  PrincipalMemberDTO,
} from "@/types/member";
import type { WardDTO } from "@/types/location";
import type { CountyDTO, SubCountyDTO } from "@/types/location";
import { ArrowLeft, Edit3, Save, Plus, Trash2, User, Users, Heart, Repeat2, FileText, CircleDollarSign, BriefcaseBusiness } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Modal from "@/components/ui/Modal";
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

type TabType = "principal" | "nok" | "dependants" | "payments";

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
  const [activeTab, setActiveTab] = useState<TabType>("nok");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<
    PrincipalFormState | NokFormState | null
  >(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editingDependant, setEditingDependant] = useState<string | null>(null);
  const [dependantFormData, setDependantFormData] = useState<Partial<Dependant>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"member" | "nok" | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferWardId, setTransferWardId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferRegion, setTransferRegion] = useState("");
  const [transferCountyId, setTransferCountyId] = useState("");
  const [transferSubCountyId, setTransferSubCountyId] = useState("");
  const [transferWards, setTransferWards] = useState<WardDTO[]>([]);
  const [transferCounties, setTransferCounties] = useState<CountyDTO[]>([]);
  const [transferSubCounties, setTransferSubCounties] = useState<SubCountyDTO[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferDataLoading, setTransferDataLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!transferOpen) return;

    let active = true;
    setTransferDataLoading(true);
    locationApi
      .getCounties()
      .then((counties) => {
        if (active) setTransferCounties(counties);
      })
      .catch((err: unknown) => {
        if (active) {
          setTransferError(
            err instanceof Error ? err.message : "Failed to load transfer locations"
          );
        }
      })
      .finally(() => {
        if (active) setTransferDataLoading(false);
      });

    return () => {
      active = false;
    };
  }, [transferOpen]);

  useEffect(() => {
    if (!transferCountyId) {
      setTransferSubCounties([]);
      setTransferSubCountyId("");
      setTransferWards([]);
      setTransferWardId("");
      return;
    }

    let active = true;
    setTransferDataLoading(true);
    locationApi
      .getSubCounties(Number(transferCountyId))
      .then((items) => {
        if (active) setTransferSubCounties(items);
      })
      .catch((err: unknown) => {
        if (active) setTransferError(err instanceof Error ? err.message : "Failed to load sub-counties");
      })
      .finally(() => {
        if (active) setTransferDataLoading(false);
      });

    return () => {
      active = false;
    };
  }, [transferCountyId]);

  useEffect(() => {
    if (!transferSubCountyId) {
      setTransferWards([]);
      setTransferWardId("");
      return;
    }

    let active = true;
    setTransferDataLoading(true);
    locationApi
      .getWards(Number(transferSubCountyId))
      .then((items) => {
        if (active) setTransferWards(items);
      })
      .catch((err: unknown) => {
        if (active) setTransferError(err instanceof Error ? err.message : "Failed to load wards");
      })
      .finally(() => {
        if (active) setTransferDataLoading(false);
      });

    return () => {
      active = false;
    };
  }, [transferSubCountyId]);

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
                  !p.dateOfBirth.trim()
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

  const openTransferModal = () => {
    if (!member) return;
    setTransferRegion("");
    setTransferCountyId("");
    setTransferSubCountyId("");
    setTransferWardId("");
    setTransferReason("");
    setTransferError(null);
    setTransferOpen(true);
  };

  const closeTransferModal = () => {
    if (!transferLoading) setTransferOpen(false);
  };

  const handleTransferMember = async () => {
    if (!member) return;
    if (!transferCountyId) {
      setTransferError("Select the target county.");
      return;
    }
    if (!transferSubCountyId) {
      setTransferError("Select the target sub-county.");
      return;
    }
    if (!transferWardId) {
      setTransferError("Select the target ward.");
      return;
    }
    if (!transferReason.trim()) {
      setTransferError("Enter the reason for this transfer.");
      return;
    }

    setTransferLoading(true);
    setTransferError(null);
    try {
      const principalId = requirePrincipalId();
      await memberTransferApi.createRequest(principalId, {
        countyId: Number(transferCountyId),
        subCountyId: Number(transferSubCountyId),
        wardId: Number(transferWardId),
        reason: transferReason.trim(),
      });
      setTransferOpen(false);
      showToast("Transfer request sent for approval");
    } catch (err: unknown) {
      setTransferError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setTransferLoading(false);
    }
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

  const principal = member.principal;
  const fullName = `${principal.firstName} ${principal.lastName}`.trim();
  const location = [principal.wardName, principal.subCountyName, principal.countyName]
    .filter(Boolean)
    .join(", ");
  const memberStatus = "Pending";
  const invoicesCount = member.dependants.length + (member.nextOfKin ? 1 : 0);

  const detailSteps: Array<{ id: TabType; label: string; number: number }> = [
    { id: "nok", label: "Next of Kin", number: 1 },
    { id: "dependants", label: "Dependants", number: 2 },
    { id: "payments", label: "Payments", number: 3 },
  ];

  const renderInfoRow = (
    label: string,
    value?: string | number | null,
    editable = false
  ) => (
    <div className="grid grid-cols-[120px_1fr_20px] items-center border-b border-gray-100 py-3 text-sm">
      <span className="font-semibold text-gray-700">{label}</span>
      <span className="text-gray-800">{value || "-"}</span>
      {editable ? <Edit3 className="h-4 w-4 text-emerald-500" /> : <span />}
    </div>
  );

  return (
    <div className="bg-gray-50 p-4 md:p-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </button>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_1fr]">
        <aside className="rounded-sm bg-white p-5 shadow-sm">
          <div className="mb-4 rounded-sm bg-cyan-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-cyan-700">SUN WELFARE</h2>
                <p className="text-xs text-cyan-700">Member Details</p>
              </div>
              <Users className="h-14 w-14 text-cyan-600" />
            </div>
          </div>

          {renderInfoRow("Full Name :", fullName, true)}
          {renderInfoRow("SHOFCO ID :", `SH-FS-${principal.id ?? routeMemberId ?? "-"}`)}
          {renderInfoRow("ID Number :", principal.nationalID, true)}
          {renderInfoRow("Mobile :", principal.phoneNumber, true)}
          {renderInfoRow("Date of Birth :", principal.dateOfBirth, true)}
          {renderInfoRow("E-mail :", "-", true)}
          {renderInfoRow("Status :", memberStatus)}
          {renderInfoRow("Subscription Expiry :", "-")}
          {renderInfoRow("Group Name :", principal.groupName || "Individual")}
          {renderInfoRow("Location :", location || "Not assigned")}

          <div className="mt-5 space-y-2">
            <HasPermission permissions={PERMISSIONS.MEMBER_WRITE}>
              <Button
                type="button"
                onClick={() => openTransferModal()}
                className="w-full bg-sky-500 hover:bg-sky-600"
              >
                <Repeat2 className="mr-2 h-4 w-4" />
                Transfer Member
              </Button>
            </HasPermission>
          </div>
        </aside>

        <main className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: "Invoices", value: invoicesCount, icon: FileText },
              { label: "Total Payment", value: "KES. 0.00", icon: CircleDollarSign },
              { label: "Claims", value: 0, icon: BriefcaseBusiness },
            ].map((item) => (
              <div key={item.label} className="rounded-sm bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className="mt-3 text-lg font-semibold text-gray-900">{item.value}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500 text-white">
                    <item.icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <section className="rounded-sm bg-white p-4 shadow-sm">
            <div className="mb-5 grid grid-cols-3 bg-cyan-50">
              {detailSteps.map((step) => {
                const selected = activeTab === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveTab(step.id)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm ${
                      selected ? "bg-cyan-100 font-semibold text-gray-900" : "text-gray-600"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                        selected
                          ? "border-sky-500 bg-sky-500 text-white"
                          : "border-sky-500 bg-white text-sky-600"
                      }`}
                    >
                      {step.number}
                    </span>
                    {step.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "nok" && (
              <div>
                <h3 className="mb-5 font-semibold text-gray-900">Next Of Kin Information</h3>
                {member.nextOfKin ? (
                  <div className="space-y-1">
                    {renderInfoRow("Full Name :", `${member.nextOfKin.firstName} ${member.nextOfKin.lastName}`)}
                    {renderInfoRow("Mobile :", member.nextOfKin.phoneNumber)}
                    {renderInfoRow("Id Number :", member.nextOfKin.idNumber)}
                    {renderInfoRow("E-mail :", "-")}
                    {renderInfoRow("Relationship :", relationshipToDisplayText(member.nextOfKin.relationship))}
                    {renderInfoRow("Status :", "-")}
                  </div>
                ) : (
                  <p className="py-8 text-center text-gray-500">No next of kin recorded.</p>
                )}
              </div>
            )}

            {activeTab === "dependants" && (
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Dependants</h3>
                  {canManageKinAndDependants && (
                    <Button
                      size="sm"
                      onClick={() => {
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
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Dependant
                    </Button>
                  )}
                </div>
                {member.dependants.length === 0 ? (
                  <p className="py-8 text-center text-gray-500">No dependants added yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-4 py-3">Full Name</th>
                          <th className="px-4 py-3">Relationship</th>
                          <th className="px-4 py-3">Gender</th>
                          <th className="px-4 py-3">Mobile</th>
                          <th className="px-4 py-3">Date of Birth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {member.dependants.map((dependant) => (
                          <tr key={dependant.id} className="border-b">
                            <td className="px-4 py-3">
                              {dependant.firstName} {dependant.lastName}
                            </td>
                            <td className="px-4 py-3">{dependant.relationship}</td>
                            <td className="px-4 py-3">{genderToDisplayText(dependant.gender)}</td>
                            <td className="px-4 py-3">{dependant.phoneNumber || "-"}</td>
                            <td className="px-4 py-3">{dependant.dateOfBirth}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "payments" && (
              <div>
                <h3 className="mb-5 font-semibold text-gray-900">Payments</h3>
                <p className="py-8 text-center text-gray-500">
                  No payment records are available for this member.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>

      <Modal
        isOpen={transferOpen}
        title="Transfer Member"
        onClose={closeTransferModal}
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeTransferModal} disabled={transferLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleTransferMember()}
              disabled={transferLoading || transferDataLoading}
            >
              {transferLoading ? "Requesting..." : "Request Transfer"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <p>
              Current ward: <strong>{principal.wardName ?? "Not assigned"}</strong>
            </p>
            <p>
              Current group: <strong>{principal.groupName || "Individual"}</strong>
            </p>
          </div>

          {transferError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {transferError}
            </p>
          )}

          <label className="block text-sm font-medium text-gray-700">
            Target region
            <select
              value={transferRegion}
              onChange={(event) => {
                setTransferRegion(event.target.value);
                setTransferCountyId("");
                setTransferSubCountyId("");
                setTransferWardId("");
              }}
              disabled={transferLoading || transferDataLoading}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select region</option>
              {Array.from(
                new Set(transferCounties.map((county) => county.region).filter(Boolean))
              )
                .sort()
                .map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Target county
            <select
              value={transferCountyId}
              onChange={(event) => {
                setTransferCountyId(event.target.value);
                setTransferSubCountyId("");
                setTransferWardId("");
              }}
              disabled={transferLoading || transferDataLoading || !transferRegion}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select county</option>
              {transferCounties
                .filter((county) => !transferRegion || county.region === transferRegion)
                .map((county) => (
                  <option key={county.id} value={county.id}>
                    {county.name}
                  </option>
                ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Target sub-county
            <select
              value={transferSubCountyId}
              onChange={(event) => {
                setTransferSubCountyId(event.target.value);
                setTransferWardId("");
              }}
              disabled={transferLoading || transferDataLoading || !transferCountyId}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select sub-county</option>
              {transferSubCounties.map((subCounty) => (
                <option key={subCounty.id} value={subCounty.id}>
                  {subCounty.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Target ward
            <select
              value={transferWardId}
              onChange={(event) => {
                setTransferWardId(event.target.value);
              }}
              disabled={transferLoading || transferDataLoading}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select ward</option>
              {transferWards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {ward.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Reason for transfer
            <textarea
              value={transferReason}
              onChange={(event) => setTransferReason(event.target.value)}
              disabled={transferLoading}
              rows={4}
              placeholder="Explain why this member is being transferred"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
            />
          </label>
        </div>
      </Modal>

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
                  <>
                    <Button onClick={() => openTransferModal()} variant="outline" size="md">
                      <Repeat2 className="w-4 h-4 mr-2" />
                      Transfer Member
                    </Button>
                    <Button onClick={handleEdit} variant="primary" size="md">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </>
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
                    <p className="mt-1 text-gray-900">{member.principal.groupName || "Individual"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ward</label>
                    <p className="mt-1 text-gray-900">{member.principal.wardName ?? "Not assigned"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sub-county</label>
                    <p className="mt-1 text-gray-900">{member.principal.subCountyName ?? "Not assigned"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">County</label>
                    <p className="mt-1 text-gray-900">{member.principal.countyName ?? "Not assigned"}</p>
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

      <Modal
        isOpen={transferOpen}
        title="Transfer Member"
        onClose={closeTransferModal}
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeTransferModal} disabled={transferLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleTransferMember()}
              disabled={transferLoading || transferDataLoading}
            >
              {transferLoading ? "Requesting..." : "Request Transfer"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <p>
              Current ward:{" "}
              <strong>{member.principal.wardName ?? "Not assigned"}</strong>
            </p>
            <p>
              Current group:{" "}
              <strong>{member.principal.groupName || "Individual"}</strong>
            </p>
          </div>

          {transferError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {transferError}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Target ward</label>
            <select
              value={transferWardId}
              onChange={(event) => {
                setTransferWardId(event.target.value);
              }}
              disabled={transferLoading || transferDataLoading}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select ward</option>
              {transferWards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {ward.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reason for transfer</label>
            <textarea
              value={transferReason}
              onChange={(event) => setTransferReason(event.target.value)}
              disabled={transferLoading}
              rows={4}
              placeholder="Explain why this member is being transferred"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <p className="text-xs text-gray-500">
            The receiving facilitator will choose the group during approval.
          </p>
        </div>
      </Modal>

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
