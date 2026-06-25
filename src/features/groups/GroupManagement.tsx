import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "@/api/client";
import { groupApi } from "@/api/groupApi";
import { groupTransferApi } from "@/api/groupTransferApi";
import { locationApi } from "@/api/locationApi";
import { assignmentApi } from "@/api/assignmentApi";
import { memberTransferApi } from "@/api/memberTransferApi";
import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import SelectInput from "@/components/ui/SelectInput";
import TextInput from "@/components/ui/TextInput";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Edit3, Eye, FileText, Plus, ThumbsDown, Trophy, UsersRound } from "lucide-react";
import type { AssignmentDTO } from "@/types/auth";
import type { GroupDetailsDTO, MemberGroupDTO } from "@/types/group";
import type { CountyDTO, SubCountyDTO, WardDTO } from "@/types/location";
import type { PrincipalMemberDTO } from "@/types/member";

export default function GroupManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<AssignmentDTO | null>(null);
  const effectiveRole = assignment?.role ?? user?.role;
  const canSelectFullLocation = effectiveRole === "ADMIN";
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
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
  const [transferGroupOpen, setTransferGroupOpen] = useState(false);
  const [transferRegion, setTransferRegion] = useState("");
  const [transferCountyId, setTransferCountyId] = useState("");
  const [transferSubCountyId, setTransferSubCountyId] = useState("");
  const [transferWardId, setTransferWardId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferCounties, setTransferCounties] = useState<CountyDTO[]>([]);
  const [transferSubCounties, setTransferSubCounties] = useState<SubCountyDTO[]>([]);
  const [transferWards, setTransferWards] = useState<WardDTO[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferDataLoading, setTransferDataLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("name");
  const [pageSize, setPageSize] = useState(100);

  const visibleWards = wards;
  const regionOptions = Array.from(
    new Set(counties.map((county) => county.region).filter(Boolean))
  ).sort() as string[];
  const visibleCounties = region
    ? counties.filter((county) => county.region === region)
    : counties;
  const filteredGroups = groups.filter((group) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    const value = searchBy === "groupId" ? group.groupId : group.name;
    return value.toLowerCase().includes(query);
  });

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
    setTransferRegion("");
    setTransferCountyId("");
    setTransferSubCountyId("");
    setTransferWardId("");
    setTransferReason("");
    setTransferError(null);
  };

  const closeGroupTransfer = () => {
    if (!transferLoading) setTransferMember(null);
  };

  const openWholeGroupTransfer = () => {
    setTransferGroupOpen(true);
    setTransferRegion("");
    setTransferCountyId("");
    setTransferSubCountyId("");
    setTransferWardId("");
    setTransferReason("");
    setTransferError(null);
  };

  const closeWholeGroupTransfer = () => {
    if (!transferLoading) setTransferGroupOpen(false);
  };

  useEffect(() => {
    if (!transferMember && !transferGroupOpen) return;

    let active = true;
    setTransferDataLoading(true);
    locationApi
      .getCounties()
      .then((rows) => {
        if (active) setTransferCounties(rows);
      })
      .catch((err: unknown) => {
        if (active) setTransferError(err instanceof Error ? err.message : "Failed to load locations");
      })
      .finally(() => {
        if (active) setTransferDataLoading(false);
      });

    return () => {
      active = false;
    };
  }, [transferMember, transferGroupOpen]);

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
      .then((rows) => {
        if (active) setTransferSubCounties(rows);
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
      .then((rows) => {
        if (active) setTransferWards(rows);
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

  const handleGroupTransfer = async () => {
    if (!transferMember?.id) return;
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
      await memberTransferApi.createRequest(transferMember.id, {
        countyId: Number(transferCountyId),
        subCountyId: Number(transferSubCountyId),
        wardId: Number(transferWardId),
        reason: transferReason.trim(),
      });
      setSuccess("Transfer request sent for receiving facilitator approval.");
      setTransferMember(null);
    } catch (err: unknown) {
      setTransferError(err instanceof Error ? err.message : "Group transfer request failed");
    } finally {
      setTransferLoading(false);
    }
  };

  const handleWholeGroupTransfer = async () => {
    if (!selectedGroup) return;
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
      setTransferError("Enter the reason for this group transfer.");
      return;
    }

    setTransferLoading(true);
    setTransferError(null);
    try {
      await groupTransferApi.createRequest(selectedGroup.group.id, {
        countyId: Number(transferCountyId),
        subCountyId: Number(transferSubCountyId),
        wardId: Number(transferWardId),
        reason: transferReason.trim(),
      });
      setSuccess("Group transfer request sent for approval.");
      setTransferGroupOpen(false);
    } catch (err: unknown) {
      setTransferError(err instanceof Error ? err.message : "Group transfer request failed");
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
      setCreateOpen(false);
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

  if (selectedGroup) {
    const group = selectedGroup.group;
    const activeMembers = selectedGroup.members.length;
    const location = [group.wardName, group.subCountyName, group.countyName]
      .filter(Boolean)
      .join(", ");

    return (
      <div className="space-y-5 bg-gray-50 p-4">
        <button
          type="button"
          onClick={() => setSelectedGroup(null)}
          className="inline-flex items-center rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </button>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_1fr]">
          <aside className="space-y-5">
            <div className="rounded-sm bg-white shadow-sm">
              <div className="rounded-t-sm bg-cyan-100 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-cyan-700">SUN WELFARE</h2>
                    <p className="text-xs text-cyan-700">Group Details</p>
                  </div>
                  <UsersRound className="h-14 w-14 text-cyan-600" />
                </div>
              </div>
              <div className="p-5">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border-4 border-gray-800 bg-white shadow">
                  <UsersRound className="h-8 w-8 text-gray-900" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                <p className="text-sm text-gray-500">Members: {selectedGroup.totalMembers}</p>
              </div>
            </div>

            <div className="rounded-sm bg-white p-5 shadow-sm">
              <h3 className="mb-5 font-semibold text-gray-900">Group Information</h3>
              <p className="mb-5 text-sm text-gray-500">Group Details</p>
              {[
                ["Name :", group.name],
                ["Group Number :", group.groupId],
                ["Status :", "Active"],
                ["Location :", location || "Not assigned"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[120px_1fr] border-b border-gray-100 py-3 text-sm"
                >
                  <span className="font-semibold text-gray-700">{label}</span>
                  <span className="text-gray-800">{value}</span>
                </div>
              ))}
              <Button
                type="button"
                className="mt-5 w-full rounded-md bg-sky-500 hover:bg-sky-600"
                onClick={openWholeGroupTransfer}
              >
                Transfer Group
              </Button>
            </div>
          </aside>

          <main className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              {[
                ["Members", selectedGroup.totalMembers],
                ["Active", activeMembers],
                ["Pending", 0],
                ["Dormant", 0],
                ["Default", 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-sm bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{label}</p>
                      <p className="mt-3 text-xl font-semibold text-gray-900">{value}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white">
                      <FileText className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-sm bg-white p-5 shadow-sm">
              <div className="mb-5 rounded-sm bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-500">Payments</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xl font-semibold text-gray-900">0</p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <h3 className="mb-5 font-semibold text-gray-900">Group Members</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-gray-600">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Full Names</th>
                      <th className="px-4 py-3">Identification Number</th>
                      <th className="px-4 py-3">Mobile No</th>
                      <th className="px-4 py-3">Gender</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Policy Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroup.members.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          No members are currently in this group.
                        </td>
                      </tr>
                    ) : (
                      selectedGroup.members.map((member) => (
                        <tr key={member.id} className="border-t">
                          <td className="px-4 py-3">
                            <input type="checkbox" aria-label={`Select ${member.firstName}`} />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{member.nationalID}</td>
                          <td className="px-4 py-3 text-rose-500">{member.phoneNumber}</td>
                          <td className="px-4 py-3 text-gray-700">{member.gender}</td>
                          <td className="px-4 py-3 text-gray-700">Active</td>
                          <td className="px-4 py-3 text-gray-700">Not Matured</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => navigate(`/members/${member.id}`)}
                              className="text-sky-500 hover:text-sky-700"
                              title="View member"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openGroupTransfer(member)}
                              className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-600"
                              title="Transfer member"
                            >
                              Transfer Member
                            </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>

        <Modal
          isOpen={!!transferMember}
          title="Transfer Member"
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
                {transferLoading ? "Requesting..." : "Request Transfer"}
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
                to another ward.
              </div>
            )}

            {transferError && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {transferError}
              </p>
            )}

            <SelectInput
              id="transfer-group-region"
              label="Target region"
              value={transferRegion}
              onChange={(value) => {
                setTransferRegion(value);
                setTransferCountyId("");
                setTransferSubCountyId("");
                setTransferWardId("");
              }}
              options={Array.from(
                new Set(transferCounties.map((county) => county.region).filter(Boolean))
              )
                .sort()
                .map((region) => ({
                  value: region,
                  label: region,
                }))}
              disabled={transferLoading || transferDataLoading}
              required
            />

            <SelectInput
              id="transfer-group-county"
              label="Target county"
              value={transferCountyId}
              onChange={(value) => {
                setTransferCountyId(value);
                setTransferSubCountyId("");
                setTransferWardId("");
              }}
              options={transferCounties
                .filter((county) => !transferRegion || county.region === transferRegion)
                .map((county) => ({
                  value: String(county.id),
                  label: county.name,
                }))}
              disabled={transferLoading || transferDataLoading || !transferRegion}
              required
            />

            <SelectInput
              id="transfer-group-sub-county"
              label="Target sub-county"
              value={transferSubCountyId}
              onChange={(value) => {
                setTransferSubCountyId(value);
                setTransferWardId("");
              }}
              options={transferSubCounties.map((subCounty) => ({
                value: String(subCounty.id),
                label: subCounty.name,
              }))}
              disabled={transferLoading || transferDataLoading || !transferCountyId}
              required
            />

            <SelectInput
              id="transfer-group-ward"
              label="Target ward"
              value={transferWardId}
              onChange={(value) => {
                setTransferWardId(value);
              }}
              options={transferWards.map((ward) => ({
                value: String(ward.id),
                label: ward.name,
              }))}
              disabled={transferLoading || transferDataLoading || !transferSubCountyId}
              required
            />

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

        <Modal
          isOpen={transferGroupOpen}
          title="Transfer Group"
          onClose={closeWholeGroupTransfer}
          maxWidth="lg"
          footer={
            <>
              <Button variant="outline" onClick={closeWholeGroupTransfer} disabled={transferLoading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => void handleWholeGroupTransfer()}
                disabled={transferLoading || transferDataLoading}
              >
                {transferLoading ? "Requesting..." : "Request Transfer"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              Moving group <strong>{group.name}</strong> to another ward.
            </div>

            {transferError && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {transferError}
              </p>
            )}

            <SelectInput
              id="whole-group-transfer-region"
              label="Target region"
              value={transferRegion}
              onChange={(value) => {
                setTransferRegion(value);
                setTransferCountyId("");
                setTransferSubCountyId("");
                setTransferWardId("");
              }}
              options={Array.from(
                new Set(transferCounties.map((county) => county.region).filter(Boolean))
              )
                .sort()
                .map((item) => ({ value: item, label: item }))}
              disabled={transferLoading || transferDataLoading}
              required
            />

            <SelectInput
              id="whole-group-transfer-county"
              label="Target county"
              value={transferCountyId}
              onChange={(value) => {
                setTransferCountyId(value);
                setTransferSubCountyId("");
                setTransferWardId("");
              }}
              options={transferCounties
                .filter((county) => !transferRegion || county.region === transferRegion)
                .map((county) => ({
                  value: String(county.id),
                  label: county.name,
                }))}
              disabled={transferLoading || transferDataLoading || !transferRegion}
              required
            />

            <SelectInput
              id="whole-group-transfer-sub-county"
              label="Target sub-county"
              value={transferSubCountyId}
              onChange={(value) => {
                setTransferSubCountyId(value);
                setTransferWardId("");
              }}
              options={transferSubCounties.map((subCounty) => ({
                value: String(subCounty.id),
                label: subCounty.name,
              }))}
              disabled={transferLoading || transferDataLoading || !transferCountyId}
              required
            />

            <SelectInput
              id="whole-group-transfer-ward"
              label="Target ward"
              value={transferWardId}
              onChange={setTransferWardId}
              options={transferWards.map((ward) => ({
                value: String(ward.id),
                label: ward.name,
              }))}
              disabled={transferLoading || transferDataLoading || !transferSubCountyId}
              required
            />

            <label className="block text-sm font-medium text-gray-700">
              Reason for transfer
              <textarea
                value={transferReason}
                onChange={(event) => setTransferReason(event.target.value)}
                disabled={transferLoading}
                rows={4}
                placeholder="Explain why this group is being transferred"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
              />
            </label>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-lg font-bold uppercase text-gray-900">Groups</h2>
        <p className="mt-3 text-sm text-gray-500">Home / Groups</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {[
          { label: "Total Groups", value: groups.length, icon: UsersRound },
          { label: "Active Groups", value: groups.length, icon: Trophy },
          { label: "Inactive Groups", value: 0, icon: ThumbsDown },
        ].map((card) => (
          <div key={card.label} className="rounded-sm bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold text-gray-900">
                  {new Intl.NumberFormat().format(card.value)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-white">
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
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

      <div className="rounded-sm bg-white p-4 shadow-sm">
        <div className="mb-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setRegion("");
              setCountyId("");
              setSubCountyId("");
              setWardId("");
              setSearchTerm("");
              setSearchBy("name");
              setGroups([]);
            }}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => void loadGroups(wardId)}
            className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600"
          >
            Search
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-4">
          <label className="space-y-2 text-sm font-medium text-gray-700">
            <span>Select Region</span>
            <select
              value={region}
              disabled={!canSelectFullLocation || assignmentLoading}
              onChange={(event) => {
                setRegion(event.target.value);
                setCountyId("");
                setSubCountyId("");
                setWardId("");
                setGroups([]);
              }}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Select Region...</option>
              {regionOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700">
            <span>Select County</span>
            <select
              value={countyId}
              disabled={!canSelectFullLocation || assignmentLoading}
              onChange={(event) => {
                setCountyId(event.target.value);
                setSubCountyId("");
                setWardId("");
                setGroups([]);
              }}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Select County...</option>
              {visibleCounties.map((county) => (
                <option key={county.id} value={county.id}>
                  {county.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700">
            <span>Select Sub-county</span>
            <select
              value={subCountyId}
              disabled={!canSelectFullLocation || !countyId || assignmentLoading}
              onChange={(event) => {
                setSubCountyId(event.target.value);
                setWardId("");
                setGroups([]);
              }}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Select Sub-county...</option>
              {subCounties.map((subCounty) => (
                <option key={subCounty.id} value={subCounty.id}>
                  {subCounty.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700">
            <span>Select Ward</span>
            <select
              value={wardId}
              disabled={assignmentLoading || (canSelectFullLocation && !subCountyId)}
              onChange={(event) => setWardId(event.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Select Ward...</option>
              {visibleWards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {ward.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-[140px_220px_1fr_auto]">
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
          <select
            value={searchBy}
            onChange={(event) => setSearchBy(event.target.value)}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="name">Select Search Field</option>
            <option value="groupId">Group Number</option>
          </select>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search"
            className="rounded-full border border-gray-200 px-4 py-2 text-sm"
          />
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-full bg-emerald-500 hover:bg-emerald-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Group
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-4 py-3"><input type="checkbox" aria-label="Select all groups" /></th>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Group Name</th>
                <th className="px-4 py-3 font-semibold">Group Number</th>
                <th className="px-4 py-3 font-semibold">Date Created</th>
                <th className="px-4 py-3 font-semibold">Sub-county</th>
                <th className="px-4 py-3 font-semibold">Ward</th>
                <th className="px-4 py-3 font-semibold">Member Count</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    {wardId
                      ? "No groups available for this ward."
                      : "Select a ward to view available groups."}
                  </td>
                </tr>
              ) : (
                filteredGroups.slice(0, pageSize).map((group) => (
                  <tr key={group.id} className="border-t">
                    <td className="px-4 py-3"><input type="checkbox" aria-label={`Select ${group.name}`} /></td>
                    <td className="px-4 py-3 text-sm text-gray-700">{group.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {group.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{group.groupId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {group.dateCreated ? new Date(group.dateCreated).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {group.subCountyName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{group.wardName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">—</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={detailsLoading}
                        onClick={() => void openGroupDetails(group)}
                        className="text-emerald-500 hover:text-emerald-700"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={createOpen}
        title="Add New Group"
        onClose={() => setCreateOpen(false)}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            id="group-name"
            label="Group name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={fieldErrors.name}
            disabled={loading}
            required
          />

          {canSelectFullLocation ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  County
                </label>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700">
                  {assignment?.countyName ?? user?.countyName ?? "Assigned county"}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Sub-county
                </label>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700">
                  {assignment?.subCountyName ??
                    user?.subCountyName ??
                    "Assigned sub-county"}
                </div>
              </div>
            </div>
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create group"}
            </Button>
          </div>
        </form>
      </Modal>

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
                              Transfer Member
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
        title="Transfer Member"
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
              {transferLoading ? "Requesting..." : "Request Transfer"}
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
              to another ward.
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
            onChange={setTransferWardId}
            options={visibleWards.map((ward) => ({
              value: String(ward.id),
              label: ward.name,
            }))}
            disabled={transferLoading || transferDataLoading}
            required
          />

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

          <p className="text-xs text-gray-500">
            The receiving facilitator will choose the group during approval.
          </p>
        </div>
      </Modal>
    </div>
  );
}
