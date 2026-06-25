import type { PrincipalMemberDTO } from "@/types/member";

export interface CreateGroupRequestDTO {
  name: string;
  countyId: number;
  subCountyId: number;
  wardId: number;
}

export interface MemberGroupDTO {
  id: number;
  groupId: string;
  name: string;
  dateCreated: string;
  countyId: number;
  countyName: string;
  subCountyId: number;
  subCountyName: string;
  wardId: number;
  wardName: string;
}

export interface GroupDetailsDTO {
  group: MemberGroupDTO;
  totalMembers: number;
  members: PrincipalMemberDTO[];
}

export interface CreateGroupTransferRequestDTO {
  countyId: number;
  subCountyId: number;
  wardId: number;
  reason: string;
}

export interface GroupTransferRequestDTO {
  id: number;
  groupId: number;
  groupCode: string;
  groupName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  countyId: number;
  countyName: string;
  subCountyId: number;
  subCountyName: string;
  wardId: number;
  wardName: string;
  reason: string;
  requestedByName?: string;
  requestedAt?: string;
  approvedAt?: string;
}
