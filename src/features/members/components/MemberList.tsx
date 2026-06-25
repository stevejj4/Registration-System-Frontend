import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  Search,
  RefreshCw,
  Edit2,
  Download,
  UserRound,
  UsersRound,
  CheckCircle2,
  Clock3,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMembers } from "@/features/members";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { assignmentApi } from "@/api/assignmentApi";
import { locationApi } from "@/api/locationApi";
import { memberApi } from "@/api/memberApi";
import MemberExportModal from "@/features/admin/MemberExportModal";
import { formatDisplayDate } from "@/utils/dateUtils";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/ui/Pagination";
import type { MemberDetailsDTO } from "@/types/member";
import type { CountyDTO, SubCountyDTO, WardDTO } from "@/types/location";

const MEMBER_PAGE_SIZE = 10;

const formatMetric = (value: number): string => new Intl.NumberFormat().format(value);

const parseDateValue = (value?: string): number | null => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

interface Props {
  onSelectMember: (id: string) => void;
  selectedId?: string;
}

export default function MemberList({ onSelectMember, selectedId }: Props) {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("ADMIN");

  const { members, loading, error, refetch } = useMembers();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("nationalID");
  const [pageSize, setPageSize] = useState(MEMBER_PAGE_SIZE);
  const [region, setRegion] = useState("");
  const [countyId, setCountyId] = useState("");
  const [subCountyId, setSubCountyId] = useState("");
  const [wardId, setWardId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [counties, setCounties] = useState<CountyDTO[]>([]);
  const [subCounties, setSubCounties] = useState<SubCountyDTO[]>([]);
  const [wards, setWards] = useState<WardDTO[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMembers, setExportMembers] = useState<MemberDetailsDTO[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setFiltersLoading(true);

    const loadInitialLocations = isAdmin
      ? locationApi.getCounties().then((items) => {
          if (active) setCounties(items);
        })
      : assignmentApi.getMyWards().then((items) => {
          if (active) setWards(items);
        });

    loadInitialLocations
      .catch((err: unknown) => {
        console.warn("Failed to load member filters:", err);
      })
      .finally(() => {
        if (active) setFiltersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!countyId) {
      setSubCounties([]);
      setSubCountyId("");
      if (isAdmin) {
        setWards([]);
        setWardId("");
      }
      return;
    }

    let active = true;
    setFiltersLoading(true);
    locationApi
      .getSubCounties(Number(countyId))
      .then((items) => {
        if (active) setSubCounties(items);
      })
      .catch((err: unknown) => {
        console.warn("Failed to load sub-county filters:", err);
      })
      .finally(() => {
        if (active) setFiltersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [countyId, isAdmin]);

  useEffect(() => {
    if (!isAdmin || !subCountyId) {
      if (isAdmin) {
        setWards([]);
        setWardId("");
      }
      return;
    }

    let active = true;
    setFiltersLoading(true);
    locationApi
      .getWards(Number(subCountyId))
      .then((items) => {
        if (active) setWards(items);
      })
      .catch((err: unknown) => {
        console.warn("Failed to load ward filters:", err);
      })
      .finally(() => {
        if (active) setFiltersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAdmin, subCountyId]);

  const filteredMembers = useMemo(
    () => {
      const query = searchTerm.trim().toLowerCase();
      const selectedCounty = counties.find((county) => String(county.id) === countyId);
      const selectedSubCounty = subCounties.find(
        (subCounty) => String(subCounty.id) === subCountyId
      );
      const selectedWard = wards.find((ward) => String(ward.id) === wardId);
      const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

      return members.filter((m) => {
        if (query) {
          const searchableValue =
            searchBy === "nationalID"
              ? m.nationalID
              : searchBy === "phoneNumber"
                ? m.phoneNumber
                : `${m.firstName} ${m.lastName}`;

          if (!searchableValue.toLowerCase().includes(query)) {
            return false;
          }
        }

        if (
          selectedCounty &&
          m.countyName &&
          m.countyName.toLowerCase() !== selectedCounty.name.toLowerCase()
        ) {
          return false;
        }

        if (
          selectedSubCounty &&
          m.subCountyName &&
          m.subCountyName.toLowerCase() !== selectedSubCounty.name.toLowerCase()
        ) {
          return false;
        }

        if (
          selectedWard &&
          m.wardName &&
          m.wardName.toLowerCase() !== selectedWard.name.toLowerCase()
        ) {
          return false;
        }

        if (
          statusFilter &&
          (m.memberStatus ?? "").toLowerCase() !== statusFilter.toLowerCase()
        ) {
          return false;
        }

        const registrationTime = parseDateValue(m.registrationDate);
        if (start !== null && registrationTime !== null && registrationTime < start) {
          return false;
        }
        if (end !== null && registrationTime !== null && registrationTime > end) {
          return false;
        }

        return true;
      });
    },
    [
      members,
      searchTerm,
      searchBy,
      counties,
      countyId,
      subCounties,
      subCountyId,
      wards,
      wardId,
      statusFilter,
      startDate,
      endDate,
    ]
  );

  const summaryCards = useMemo(() => {
    const groupMembers = members.filter((m) => Boolean(m.groupName)).length;
    const activeMembers = members.filter(
      (m) => (m.memberStatus ?? "ACTIVE").toUpperCase() === "ACTIVE"
    ).length;
    const pendingMembers = members.filter(
      (m) => (m.memberStatus ?? "").toUpperCase() === "PENDING"
    ).length;
    const dormantMembers = members.filter(
      (m) => (m.memberStatus ?? "").toUpperCase() === "DORMANT"
    ).length;
    const defaultMembers = members.filter(
      (m) => (m.policyStatus ?? "").toUpperCase() === "DEFAULT"
    ).length;

    return [
      {
        label: "Total Members",
        value: members.length,
        icon: UserRound,
        accent: "bg-sky-500",
      },
      {
        label: "Group Members",
        value: groupMembers,
        icon: UsersRound,
        accent: "bg-sky-500",
      },
      {
        label: "Active Members",
        value: activeMembers,
        icon: CheckCircle2,
        accent: "bg-emerald-500",
      },
      {
        label: "Pending",
        value: pendingMembers,
        icon: Clock3,
        accent: "bg-sky-500",
      },
      {
        label: "Dormant Members",
        value: dormantMembers,
        icon: Clock3,
        accent: "bg-sky-500",
      },
      {
        label: "Default Members",
        value: defaultMembers,
        icon: AlertCircle,
        accent: "bg-rose-500",
      },
    ];
  }, [members]);

  const regionOptions = useMemo(
    () =>
      Array.from(
        new Set(counties.map((county) => county.region).filter(Boolean))
      ).sort() as string[],
    [counties]
  );

  const visibleCounties = useMemo(
    () =>
      region
        ? counties.filter((county) => county.region === region)
        : counties,
    [counties, region]
  );

  const {
    page,
    setPage,
    paginatedItems: paginatedMembers,
    totalItems,
    totalPages,
    rangeStart,
    rangeEnd,
  } = usePagination(filteredMembers, pageSize, [
    searchTerm,
    searchBy,
    countyId,
    subCountyId,
    wardId,
    statusFilter,
    startDate,
    endDate,
  ]);

  const activeId = selectedId ?? routeId;
  const colSpan = 13;

  const handleSelect = (id: string | number) => {
    if (onSelectMember) {
      onSelectMember(String(id));
    } else {
      navigate(`/members/${id}`);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSearchBy("nationalID");
    setRegion("");
    setCountyId("");
    setSubCountyId("");
    setWardId("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  const openExport = useCallback(async () => {
    setExportOpen(true);
    setExportLoading(true);
    try {
      const details = await memberApi.getAllDetails();
      setExportMembers(details);
    } catch {
      setExportMembers([]);
    } finally {
      setExportLoading(false);
    }
  }, []);

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-gray-500">{card.label}</p>
                <p className="mt-3 text-xl font-semibold text-gray-900">
                  {formatMetric(card.value)}
                </p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-full text-white ${card.accent}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="space-y-4 border-b border-gray-100 p-4">
          <div className="flex justify-end gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={openExport}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Select Region</span>
              <select
                value={region}
                onChange={(event) => {
                  setRegion(event.target.value);
                  setCountyId("");
                  setSubCountyId("");
                  setWardId("");
                  setPage(0);
                }}
                disabled={!isAdmin || filtersLoading}
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
                onChange={(event) => {
                  setCountyId(event.target.value);
                  setPage(0);
                }}
                disabled={!isAdmin || filtersLoading}
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
                onChange={(event) => {
                  setSubCountyId(event.target.value);
                  setPage(0);
                }}
                disabled={!isAdmin || !countyId || filtersLoading}
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
                onChange={(event) => {
                  setWardId(event.target.value);
                  setPage(0);
                }}
                disabled={filtersLoading || (isAdmin && !subCountyId)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">Select Ward...</option>
                {wards.map((ward) => (
                  <option key={ward.id} value={ward.id}>
                    {ward.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Start Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setPage(0);
                }}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>End Date</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setPage(0);
                }}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(0);
              }}
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
              <option value="nationalID">Search by: ID Number</option>
              <option value="phoneNumber">Search by: Mobile</option>
              <option value="name">Search by: Full Name</option>
            </select>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(0);
              }}
              placeholder="Enter search value"
              className="rounded-md border border-gray-200 px-3 py-2 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(0);
              }}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Select Status...</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="DORMANT">Dormant</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="sr-only"
            aria-label="Refresh members"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-4 text-[11px] font-bold text-gray-700 uppercase tracking-widest">ID</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-700 uppercase tracking-widest">Full Name</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-700 uppercase tracking-widest">Registration Date</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-700 uppercase tracking-widest">SHOFCO ID</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-700 uppercase tracking-widest">National ID</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-700 uppercase tracking-widest">Mobile</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-700 uppercase tracking-widest">County</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-700 uppercase tracking-widest">Sub County</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-700 uppercase tracking-widest">Ward Name</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-700 uppercase tracking-widest">Group Name</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-700 uppercase tracking-widest">Member Status</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-700 uppercase tracking-widest">Policy Status</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-700 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colSpan} className="px-6 py-12 text-center text-gray-400 font-medium">
                    Loading principal records...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={colSpan} className="px-6 py-12 text-center text-red-500 font-medium">{error}</td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-6 py-12 text-center text-gray-400 font-medium">No members found</td>
                </tr>
              ) : (
                paginatedMembers.map((member) => (
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
                    <td className="px-4 py-4 text-sm text-gray-900 font-medium">{member.id}</td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {formatDisplayDate(member.registrationDate)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{member.id}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{member.nationalID}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{member.phoneNumber}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{member.countyName || "—"}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{member.subCountyName || "—"}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{member.wardName || "—"}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{member.groupName || "—"}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{member.memberStatus || "Active"}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{member.policyStatus || "—"}</td>
                    <td className="px-4 py-4 text-sm text-center">
                      <button
                        type="button"
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

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onPageChange={setPage}
        />
      </div>

      {isAdmin && (
        <MemberExportModal
          isOpen={exportOpen}
          onClose={() => setExportOpen(false)}
          members={exportMembers}
          loading={exportLoading}
        />
      )}
    </>
  );
}
