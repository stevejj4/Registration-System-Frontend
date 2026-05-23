import { apiClient, handleError } from "./client";
import {
  mapMemberDetails,
  mapMemberListItem,
  mapNextOfKin,
  mapDependant,
} from "@/features/members/mappers/memberMapper";
import { validateId } from "@/utils/apiValidation";

import type {
  MemberDetailsDTO,
  MemberListItemDTO,
  RegisterMemberRequestDTO,
  DependantDTO,
  NextOfKinDTO,
  PrincipalMemberDTO,
} from "@/types/member";

const MEMBERS_BASE = "/v1/members";

const mapApiMemberResponse = (data: unknown): MemberDetailsDTO => {
  if (!data || typeof data !== "object") {
    return mapMemberDetails(data);
  }

  const record = data as Record<string, unknown>;

  if ("firstName" in record && !("principal" in record) && !("member" in record)) {
    return mapMemberDetails({ member: data });
  }

  return mapMemberDetails(data);
};

const mergePrincipalIntoMember = (
  existing: MemberDetailsDTO | null | undefined,
  principal: PrincipalMemberDTO
): MemberDetailsDTO => ({
  principal,
  nextOfKin: existing?.nextOfKin ?? null,
  dependants: existing?.dependants ?? [],
});

export const memberApi = {
  async getAll(): Promise<MemberListItemDTO[]> {
    try {
      const res = await apiClient.get(MEMBERS_BASE);
      return (res.data ?? []).map(mapMemberListItem);
    } catch (error) {
      handleError(error, "Failed to fetch members");
      throw error;
    }
  },

  async getById(id: number | string): Promise<MemberDetailsDTO> {
    const memberId = validateId(id, "member ID");

    try {
      const res = await apiClient.get(`${MEMBERS_BASE}/${memberId}`);
      return mapApiMemberResponse(res.data);
    } catch (error) {
      handleError(error, "Failed to fetch member");
      throw error;
    }
  },

  async getByNationalId(nationalId: string): Promise<MemberDetailsDTO> {
    if (!nationalId?.trim()) {
      throw new Error("National ID is required");
    }

    const encoded = encodeURIComponent(nationalId.trim());

    try {
      const res = await apiClient.get(`${MEMBERS_BASE}/search/${encoded}`);
      return mapApiMemberResponse(res.data);
    } catch (error) {
      handleError(error, "Failed to fetch by national ID");
      throw error;
    }
  },

  async registerMember(
    payload: RegisterMemberRequestDTO
  ): Promise<MemberDetailsDTO> {
    try {
      const cleaned: RegisterMemberRequestDTO = {
        principal: { ...payload.principal, id: undefined },
        nextOfKin: { ...payload.nextOfKin, id: undefined },
        dependants: (payload.dependants ?? []).map((d: DependantDTO) => ({
          ...d,
          id: undefined,
        })),
      };

      const res = await apiClient.post(`${MEMBERS_BASE}/register`, cleaned);
      return mapApiMemberResponse(res.data);
    } catch (error) {
      handleError(error, "Failed to register member");
      throw error;
    }
  },

  async patchPrincipal(
    id: number | string,
    data: Partial<PrincipalMemberDTO>,
    existing?: MemberDetailsDTO | null
  ): Promise<MemberDetailsDTO> {
    const memberId = validateId(id, "principal member ID");

    try {
      const res = await apiClient.patch(`${MEMBERS_BASE}/${memberId}`, data);
      const mapped = mapApiMemberResponse(res.data);
      if (existing && mapped.principal && !mapped.nextOfKin && mapped.dependants.length === 0) {
        return mergePrincipalIntoMember(existing, mapped.principal);
      }
      return mapped;
    } catch (error) {
      handleError(error, "Failed to update member");
      throw error;
    }
  },

  async updatePrincipal(
    id: number | string,
    data: PrincipalMemberDTO,
    existing?: MemberDetailsDTO | null
  ): Promise<MemberDetailsDTO> {
    const memberId = validateId(id, "principal member ID");

    try {
      const res = await apiClient.put(`${MEMBERS_BASE}/${memberId}`, data);
      const mapped = mapApiMemberResponse(res.data);
      if (existing && mapped.principal && !mapped.nextOfKin && mapped.dependants.length === 0) {
        return mergePrincipalIntoMember(existing, mapped.principal);
      }
      return mapped;
    } catch (error) {
      handleError(error, "Failed to update member");
      throw error;
    }
  },

  async deleteMember(id: number | string): Promise<void> {
    const memberId = validateId(id, "member ID");

    try {
      await apiClient.delete(`${MEMBERS_BASE}/${memberId}`);
    } catch (error) {
      handleError(error, "Failed to delete member");
      throw error;
    }
  },

  async updateNextOfKin(
    principalId: number | string,
    data: NextOfKinDTO,
    existing: MemberDetailsDTO
  ): Promise<MemberDetailsDTO> {
    const pid = validateId(principalId, "principal ID");

    try {
      const res = await apiClient.put(`${MEMBERS_BASE}/${pid}/next-of-kin`, data);
      return {
        ...existing,
        nextOfKin: mapNextOfKin(res.data),
      };
    } catch (error) {
      handleError(error, "Failed to update next of kin");
      throw error;
    }
  },

  async patchNextOfKin(
    principalId: number | string,
    data: Partial<NextOfKinDTO>,
    existing: MemberDetailsDTO
  ): Promise<MemberDetailsDTO> {
    const pid = validateId(principalId, "principal ID");

    try {
      const res = await apiClient.patch(`${MEMBERS_BASE}/${pid}/next-of-kin`, data);
      return {
        ...existing,
        nextOfKin: mapNextOfKin(res.data),
      };
    } catch (error) {
      handleError(error, "Failed to patch next of kin");
      throw error;
    }
  },

  async deleteNextOfKin(
    principalId: number | string,
    existing: MemberDetailsDTO
  ): Promise<MemberDetailsDTO> {
    const pid = validateId(principalId, "principal ID");

    try {
      await apiClient.delete(`${MEMBERS_BASE}/${pid}/next-of-kin`);
      return { ...existing, nextOfKin: null };
    } catch (error) {
      handleError(error, "Failed to delete next of kin");
      throw error;
    }
  },

  async addDependant(
    principalId: number | string,
    data: Omit<DependantDTO, "id">,
    existing: MemberDetailsDTO
  ): Promise<MemberDetailsDTO> {
    const pid = validateId(principalId, "principal ID");

    try {
      const res = await apiClient.post(`${MEMBERS_BASE}/${pid}/dependants`, data);
      const dependant = mapDependant(res.data);
      return {
        ...existing,
        dependants: [...existing.dependants, dependant],
      };
    } catch (error) {
      handleError(error, "Failed to add dependant");
      throw error;
    }
  },

  async patchDependant(
    _principalId: number | string,
    dependantId: number | string,
    data: Partial<DependantDTO>,
    existing: MemberDetailsDTO
  ): Promise<MemberDetailsDTO> {
    const did = validateId(dependantId, "dependant ID");

    try {
      const res = await apiClient.patch(`${MEMBERS_BASE}/dependants/${did}`, data);
      const updated = mapDependant(res.data);
      return {
        ...existing,
        dependants: existing.dependants.map((d) =>
          d.id === updated.id ? updated : d
        ),
      };
    } catch (error) {
      handleError(error, "Failed to update dependant");
      throw error;
    }
  },

  async deleteDependant(
    principalId: number | string,
    dependantId: number | string,
    existing: MemberDetailsDTO
  ): Promise<MemberDetailsDTO> {
    const pid = validateId(principalId, "principal ID");
    const did = validateId(dependantId, "dependant ID");

    try {
      await apiClient.delete(`${MEMBERS_BASE}/${pid}/dependants/${did}`);
      return {
        ...existing,
        dependants: existing.dependants.filter((d) => d.id !== did),
      };
    } catch (error) {
      handleError(error, "Failed to delete dependant");
      throw error;
    }
  },
};
