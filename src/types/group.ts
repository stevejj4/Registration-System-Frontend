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
