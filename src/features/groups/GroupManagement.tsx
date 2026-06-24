import React, { useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import { groupApi } from "@/api/groupApi";
import { locationApi } from "@/api/locationApi";
import { assignmentApi } from "@/api/assignmentApi";
import { memberApi } from "@/api/memberApi";
import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import SelectInput from "@/components/ui/SelectInput";
import TextInput from "@/components/ui/TextInput";
import { useAuth } from "@/hooks/useAuth";
import type { AssignmentDTO } from "@/types/auth";
import type { GroupDetailsDTO, MemberGroupDTO } from "@/types/group";
import type { CountyDTO, SubCountyDTO, WardDTO } from "@/types/location";
import type { PrincipalMemberDTO, RegistrationType } from "@/types/member";

export default function GroupManagement() {
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<AssignmentDTO | null>(null);
  const effectiveRole = assignment?.role ?? user?.role;
  const canSelectFullLocation = effectiveRole === "ADMIN";
  const [name, setName] = useState("");
  const [countyId, setCountyId] = useState("");
  const [subCountyId, setSubCountyId] = useState("");
  const [wardId, setWardId] = useState("");
  const [counties, setCounties] = useState<CountyDTO[]>([]);
  const [subCounties, setSubCounties] = useState<SubCountyDTO[]>([]);
  const [wards, setWards] = useState<WardDTO[]>([]);
  const [groups, setGroups] = useState<MemberGroupDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedGroup, setSelectedGroup] = useState<GroupDetailsDTO | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [transferMember, setTransferMember] = useState<PrincipalMemberDTO | null>(null);
  const [transferWardId, setTransferWardId] = useState("");
  const [transferGroupId, setTransferGroupId] = useState("");
  const [transferGroups, setTransferGroups] = useState<MemberGroupDTO[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferDataLoading, setTransferDataLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const visibleWards = wards;

  useEffect(() => {
    let active = true;
    setAssignmentLoading(true);
    assignmentApi
      .getMyAssignment()
      .then((data) => {
        if (active) setAssignment(data);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load assignment")
      )
      .finally(() => {
        if (active) setAssignmentLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!canSelectFullLocation) return;

    locationApi
      .getCounties()
      .then(setCounties)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load counties")
      );
  }, [canSelectFullLocation]);

  useEffect(() => {
    if (canSelectFullLocation || !assignment) return;

    setCountyId(assignment.countyId ? String(assignment.countyId) : "");
    setSubCountyId(assignment.subCountyId ? String(assignment.subCountyId) : "");
    if (assignment.wardIds.length === 1) {
      setWardId(String(assignment.wardIds[0]));
    }
  }, [assignment, canSelectFullLocation]);

  useEffect(() => {
    if (!canSelectFullLocation || !countyId) {
      setSubCounties([]);
      return;
    }

    locationApi
      .getSubCounties(Number(countyId))
      .then(setSubCounties)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load sub-counties")
      );
  }, [canSelectFullLocation, countyId]);

  useEffect(() => {
    if (!subCountyId) {
      setWards([]);
      return;
    }

    const wardsPromise = canSelectFullLocation
      ? locationApi.getWards(Number(subCountyId))
      : assignmentApi.getMyWards();

    wardsPromise
      .then(setWards)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load wards")
      );
  }, [canSelectFullLocation, subCountyId]);

  const loadGroups = async (selectedWardId: string) => {
    if (!selectedWardId) {
      setGroups([]);
      return;
    }

    setGroupsLoading(true);
    setError(null);
    try {
      const rows = await groupApi.getGroups({ wardId: Number(selectedWardId) });
      setGroups(rows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
      setGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  const openGroupDetails = async (group: MemberGroupDTO) => {
    setDetailsLoading(true);
    setError(null);
    try {
      const details = await groupApi.getGroupDetails(group.id);
      setSelectedGroup(details);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load group details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const openGroupTransfer = (member: PrincipalMemberDTO) => {
    setTransferMember(member);
    setTransferWardId(member.wardId ? String(member.wardId) : wardId);
    setTransferGroupId("");
    setTransferGroups([]);
    setTransferError(null);
  };

  const closeGroupTransfer = () => {
    if (!transferLoading) setTransferMember(null);
  };

  useEffect(() => {
    if (!transferMember || !transferWardId) {
      setTransferGroups([]);
      return;
    }

    let active = true;
    setTransferDataLoading(true);
    groupApi
      .getGroups({ wardId: Number(transferWardId) })
      .then((rows) => {
        if (active) setTransferGroups(rows);
      })
      .catch((err: unknown) => {
        if (active) {
          setTransferError(err instanceof Error ? err.message : "Failed to load target groups");
          setTransferGroups([]);
        }
      })
      .finally(() => {
        if (active) setTransferDataLoading(false);
      });

    return () => {
      active = false;
    };
  }, [transferMember, transferWardId]);

  const handleGroupTransfer = async () => {
    if (!transferMember?.id) return;
    if (!transferWardId) {
      setTransferError("Select the target ward.");
      return;
    }
    if (!transferGroupId) {
      setTransferError("Select the target group.");
      return;
    }

    setTransferLoading(true);
    setTransferError(null);
    try {
      await memberApi.transferMember(transferMember.id, {
        wardId: Number(transferWardId),
        registrationType: "GROUP" as RegistrationType,
        groupId: Number(transferGroupId),
      });
      setSuccess("Member transferred to selected group.");
      setTransferMember(null);
      if (selectedGroup) {
        setSelectedGroup(await groupApi.getGroupDetails(selectedGroup.group.id));
      }
      if (wardId) {
        await loadGroups(wardId);
      }
    } catch (err: unknown) {
      setTransferError(err instanceof Error ? err.message : "Group transfer failed");
    } finally {
      setTransferLoading(false);
    }
  };

  useEffect(() => {
    void loadGroups(wardId);
  }, [wardId]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Group name is required.";
    if (!countyId) next.countyId = "County is required.";
    if (!subCountyId) next.subCountyId = "Sub-county is required.";
    if (!wardId) next.wardId = "Ward is required.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    try {
      const created = await groupApi.createGroup({
        name: name.trim(),
        countyId: Number(countyId),
        subCountyId: Number(subCountyId),
        wardId: Number(wardId),
      });
      setSuccess(`${created.name} created successfully.`);
      setName("");
      await loadGroups(wardId);
    } catch (err: unknown) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
      }
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Groups</h2>
        <p className="text-gray-600">
          Create and view groups within your assigned location scope.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4"
      >
        <h3 className="text-lg font-semibold text-gray-900">Create group</h3>
        <TextInput
          id="group-name"
          label="Group name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fieldErrors.name}
          disabled={loading}
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {canSelectFullLocation ? (
            <>
              <SelectInput
                id="group-county"
                label="County"
                value={countyId}
                onChange={(value) => {
                  setCountyId(value);
                  setSubCountyId("");
                  setWardId("");
                  setGroups([]);
                }}
                options={counties.map((county) => ({
                  value: String(county.id),
                  label: county.name,
                }))}
                error={fieldErrors.countyId}
                disabled={loading}
                required
              />
              <SelectInput
                id="group-sub-county"
                label="Sub-county"
                value={subCountyId}
                onChange={(value) => {
                  setSubCountyId(value);
                  setWardId("");
                  setGroups([]);
                }}
                options={subCounties.map((subCounty) => ({
                  value: String(subCounty.id),
                  label: subCounty.name,
                }))}
                error={fieldErrors.subCountyId}
                disabled={loading || !countyId}
                required
              />
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  County
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700">
                  {assignment?.countyName ?? user?.countyName ?? "Assigned county"}
                </div>
                {fieldErrors.countyId && (
                  <div role="alert" className="mt-1.5 text-sm text-red-600 font-medium">
                    {fieldErrors.countyId}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sub-county
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700">
                  {assignment?.subCountyName ??
                    user?.subCountyName ??
                    "Assigned sub-county"}
                </div>
                {fieldErrors.subCountyId && (
                  <div role="alert" className="mt-1.5 text-sm text-red-600 font-medium">
                    {fieldErrors.subCountyId}
                  </div>
                )}
              </div>
            </>
          )}
          <SelectInput
            id="group-ward"
            label="Ward"
            value={wardId}
            onChange={setWardId}
            options={visibleWards.map((ward) => ({
              value: String(ward.id),
              label: ward.name,
            }))}
            error={fieldErrors.wardId}
            disabled={loading || assignmentLoading || !subCountyId}
            required
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create group"}
          </Button>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Available groups</h3>
          {groupsLoading && <span className="text-sm text-gray-500">Loading...</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-sm text-gray-700">
              <tr>
                <th className="px-6 py-3 font-semibold">Group ID</th>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Ward</th>
                <th className="px-6 py-3 font-semibold">Sub-county</th>
                <th className="px-6 py-3 font-semibold">County</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {wardId
                      ? "No groups available for this ward."
                      : "Select a ward to view available groups."}
                  </td>
                </tr>
              ) : (
                groups.map((group) => (
                  <tr key={group.id} className="border-t">
                    <td className="px-6 py-3 text-sm text-gray-700">{group.groupId}</td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      {group.name}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">{group.wardName}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {group.subCountyName}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">{group.countyName}</td>
                    <td className="px-6 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={detailsLoading}
                        onClick={() => void openGroupDetails(group)}
                      >
                        View stats
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={!!selectedGroup}
        title={selectedGroup ? `${selectedGroup.group.name} details` : "Group details"}
        onClose={() => setSelectedGroup(null)}
        maxWidth="xl"
      >
        {selectedGroup && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Total members
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {selectedGroup.totalMembers}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Group ID
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedGroup.group.groupId}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Ward
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {selectedGroup.group.wardName}
                </p>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Members in this group
              </h4>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-sm text-gray-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">National ID</th>
                      <th className="px-4 py-3 font-semibold">Phone</th>
                      <th className="px-4 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroup.members.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          No members are currently in this group.
                        </td>
                      </tr>
                    ) : (
                      selectedGroup.members.map((member) => (
                        <tr key={member.id} className="border-t">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {member.nationalID}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {member.phoneNumber}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openGroupTransfer(member)}
                            >
                              Transfer Group
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!transferMember}
        title="Transfer member to group"
        onClose={closeGroupTransfer}
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeGroupTransfer} disabled={transferLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleGroupTransfer()}
              disabled={transferLoading || transferDataLoading}
            >
              {transferLoading ? "Transferring..." : "Confirm Transfer"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {transferMember && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              Moving{" "}
              <strong>
                {transferMember.firstName} {transferMember.lastName}
              </strong>{" "}
              to another approved group.
            </div>
          )}

          {transferError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {transferError}
            </p>
          )}

          <SelectInput
            id="transfer-group-ward"
            label="Target ward"
            value={transferWardId}
            onChange={(value) => {
              setTransferWardId(value);
              setTransferGroupId("");
            }}
            options={visibleWards.map((ward) => ({
              value: String(ward.id),
              label: ward.name,
            }))}
            disabled={transferLoading || transferDataLoading}
            required
          />

          <SelectInput
            id="transfer-group-target"
            label="Target group"
            value={transferGroupId}
            onChange={setTransferGroupId}
            options={transferGroups.map((group) => ({
              value: String(group.id),
              label: `${group.name} (${group.groupId})`,
            }))}
            disabled={transferLoading || transferDataLoading || !transferWardId}
            required
          />

          <p className="text-xs text-gray-500">
            Only wards and groups approved for your account are available.
          </p>
        </div>
      </Modal>
    </div>
  );
}
