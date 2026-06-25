import React, { useEffect, useState } from "react";
import { CheckCircle2, FileText, RefreshCw } from "lucide-react";
import { groupApi } from "@/api/groupApi";
import { groupTransferApi } from "@/api/groupTransferApi";
import { memberTransferApi } from "@/api/memberTransferApi";
import { Button } from "@/components/ui/Button";
import type { GroupTransferRequestDTO, MemberGroupDTO } from "@/types/group";
import type { MemberTransferRequestDTO } from "@/types/member";

type TransferRow =
  | { kind: "MEMBER"; data: MemberTransferRequestDTO }
  | { kind: "GROUP"; data: GroupTransferRequestDTO };

export default function TransferApprovals() {
  const [requests, setRequests] = useState<MemberTransferRequestDTO[]>([]);
  const [groupRequests, setGroupRequests] = useState<GroupTransferRequestDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvingKey, setApprovingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const [memberRows, groupRows] = await Promise.all([
        memberTransferApi.getHistory(),
        groupTransferApi.getHistory(),
      ]);
      setRequests(memberRows);
      setGroupRequests(groupRows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load transfer requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const approve = async (request: MemberTransferRequestDTO, groupId: number) => {
    setApprovingKey(`member-${request.id}`);
    setError(null);
    setSuccess(null);
    try {
      await memberTransferApi.approve(request.id, { groupId });
      const selectedGroup = await groupApi.getGroups({ wardId: request.wardId }).then((rows) =>
        rows.find((group) => group.id === groupId)
      );
      setRequests((current) =>
        current.map((item) =>
          item.id === request.id
            ? {
                ...item,
                status: "APPROVED",
                groupId,
                groupName: selectedGroup?.name ?? item.groupName,
              }
            : item
        )
      );
      setSuccess(`${request.memberName} transfer approved.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve transfer");
    } finally {
      setApprovingKey(null);
    }
  };

  const approveGroup = async (request: GroupTransferRequestDTO) => {
    setApprovingKey(`group-${request.id}`);
    setError(null);
    setSuccess(null);
    try {
      await groupTransferApi.approve(request.id);
      setGroupRequests((current) =>
        current.map((item) =>
          item.id === request.id ? { ...item, status: "APPROVED" } : item
        )
      );
      setSuccess(`${request.groupName} group transfer approved.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve group transfer");
    } finally {
      setApprovingKey(null);
    }
  };

  const allRows: TransferRow[] = [
    ...requests.map((data) => ({ kind: "MEMBER" as const, data })),
    ...groupRequests.map((data) => ({ kind: "GROUP" as const, data })),
  ].sort((a, b) => {
    const left = a.data.requestedAt ? new Date(a.data.requestedAt).getTime() : 0;
    const right = b.data.requestedAt ? new Date(b.data.requestedAt).getTime() : 0;
    return right - left;
  });

  const pendingRows = allRows.filter((row) => row.data.status === "PENDING");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold uppercase text-gray-900">Transfers</h2>
          <p className="mt-2 text-sm text-gray-500">
            Review transfer history, approve new requests, and distinguish member transfers from group transfers.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadRequests()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {[
          ["Pending Transfers", pendingRows.length],
          ["Member Transfers", requests.length],
          ["Group Transfers", groupRequests.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-sm bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="mt-3 text-2xl font-semibold text-gray-900">{value}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500 text-white">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </p>
      )}

      <div className="overflow-x-auto rounded-sm bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Identifier</th>
              <th className="px-4 py-3">Target Location</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Place In Group</th>
              <th className="px-4 py-3">Requested By</th>
              <th className="px-4 py-3">Status / Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  Loading transfer requests...
                </td>
              </tr>
            ) : allRows.length === 0 ? (
              <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  No transfer history for your assigned area.
                </td>
              </tr>
            ) : (
              allRows.map((row) => (
                row.kind === "MEMBER" ? (
                  <TransferRequestRow
                    key={`member-${row.data.id}`}
                    request={row.data}
                    approving={approvingKey === `member-${row.data.id}`}
                    onApprove={approve}
                  />
                ) : (
                  <GroupTransferRequestRow
                    key={`group-${row.data.id}`}
                    request={row.data}
                    approving={approvingKey === `group-${row.data.id}`}
                    onApprove={approveGroup}
                  />
                )
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface TransferRequestRowProps {
  request: MemberTransferRequestDTO;
  approving: boolean;
  onApprove: (request: MemberTransferRequestDTO, groupId: number) => void;
}

function TransferRequestRow({
  request,
  approving,
  onApprove,
}: TransferRequestRowProps) {
  const [groups, setGroups] = useState<MemberGroupDTO[]>([]);
  const [groupId, setGroupId] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingGroups(true);
    setRowError(null);
    groupApi
      .getGroups({ wardId: request.wardId })
      .then((rows) => {
        if (active) setGroups(rows);
      })
      .catch((err: unknown) => {
        if (active) {
          setRowError(err instanceof Error ? err.message : "Failed to load groups");
        }
      })
      .finally(() => {
        if (active) setLoadingGroups(false);
      });

    return () => {
      active = false;
    };
  }, [request.wardId]);

  return (
    <tr className="border-t align-top">
      <td className="px-4 py-3">
        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
          Member Transfer
        </span>
      </td>
      <td className="px-4 py-3 font-medium text-gray-900">{request.memberName}</td>
      <td className="px-4 py-3 text-gray-700">{request.nationalID}</td>
      <td className="px-4 py-3 text-gray-700">
        {[request.wardName, request.subCountyName, request.countyName]
          .filter(Boolean)
          .join(", ")}
      </td>
      <td className="max-w-xs px-4 py-3 text-gray-700">{request.reason}</td>
      <td className="px-4 py-3">
        {request.status === "PENDING" ? (
          <>
            <select
              value={groupId}
              onChange={(event) => setGroupId(event.target.value)}
              disabled={loadingGroups || approving}
              className="min-w-48 rounded-md border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
            >
              <option value="">
                {loadingGroups ? "Loading groups..." : "Select group"}
              </option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.groupId})
                </option>
              ))}
            </select>
            {rowError && <p className="mt-1 text-xs text-red-600">{rowError}</p>}
          </>
        ) : (
          <span className="text-gray-600">{request.groupName ?? "Placed"}</span>
        )}
      </td>
      <td className="px-4 py-3 text-gray-700">{request.requestedByName ?? "-"}</td>
      <td className="px-4 py-3">
        {request.status === "PENDING" ? (
          <Button
            type="button"
            className="rounded-full bg-emerald-500 hover:bg-emerald-600"
            disabled={approving || !groupId}
            onClick={() => onApprove(request, Number(groupId))}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {approving ? "Approving..." : "Approve"}
          </Button>
        ) : (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            Done
          </span>
        )}
      </td>
    </tr>
  );
}

interface GroupTransferRequestRowProps {
  request: GroupTransferRequestDTO;
  approving: boolean;
  onApprove: (request: GroupTransferRequestDTO) => void;
}

function GroupTransferRequestRow({
  request,
  approving,
  onApprove,
}: GroupTransferRequestRowProps) {
  return (
    <tr className="border-t align-top">
      <td className="px-4 py-3">
        <span className="rounded-full bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700">
          Group Transfer
        </span>
      </td>
      <td className="px-4 py-3 font-medium text-gray-900">{request.groupName}</td>
      <td className="px-4 py-3 text-gray-700">{request.groupCode}</td>
      <td className="px-4 py-3 text-gray-700">
        {[request.wardName, request.subCountyName, request.countyName]
          .filter(Boolean)
          .join(", ")}
      </td>
      <td className="max-w-xs px-4 py-3 text-gray-700">{request.reason}</td>
      <td className="px-4 py-3 text-gray-500">Not required</td>
      <td className="px-4 py-3 text-gray-700">{request.requestedByName ?? "-"}</td>
      <td className="px-4 py-3">
        {request.status === "PENDING" ? (
          <Button
            type="button"
            className="rounded-full bg-emerald-500 hover:bg-emerald-600"
            disabled={approving}
            onClick={() => onApprove(request)}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {approving ? "Approving..." : "Approve"}
          </Button>
        ) : (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            Done
          </span>
        )}
      </td>
    </tr>
  );
}
