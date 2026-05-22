// src/services/memberApi.ts

import { apiClient, handleError } from "./client";
import {
  mapMemberDetails,
  mapMemberListItem,
} from "@/features/members/mappers/memberMapper";

import type {
  MemberDetailsDTO,
  MemberListItemDTO,
  RegisterMemberRequestDTO,
  DependantDTO,
  NextOfKinDTO,
  PrincipalMemberDTO,
} from "@/types/member";

/* -------------------------------------------------------------------------- */
/*                              ROLE RESOLVER                                 */
/* -------------------------------------------------------------------------- */

const getRole = (): string => {
  const raw = localStorage.getItem("auth_user");

  if (!raw) {
    throw new Error("Not authenticated");
  }

  let user: any;

  try {
    user = JSON.parse(raw);
  } catch {
    throw new Error("Malformed auth_user");
  }

  const role = user?.role;

  if (!role) {
    throw new Error("Invalid user role");
  }

  return role;
};

/* -------------------------------------------------------------------------- */
/*                         BASE ENDPOINT RESOLVER                             */
/* -------------------------------------------------------------------------- */

const getMembersBase = (): string => {
  const role = getRole().toLowerCase();
  return `/${role}/members`;
};

const getRegisterBase = (): string => {
  const role = getRole().toLowerCase();

  switch (role) {
    case "admin":
      return "/admin/members/register";

    case "coordinator":
      return "/coordinator/members/register";

    case "facilitator":
      return "/facilitator/register";

    default:
      throw new Error(`Unsupported role: ${role}`);
  }
};

/* -------------------------------------------------------------------------- */
/*                               MEMBER API                                   */
/* -------------------------------------------------------------------------- */

export const memberApi = {
  /* ---------------------------- GET ALL MEMBERS --------------------------- */
  async getAll(): Promise<MemberListItemDTO[]> {
    try {
      const res = await apiClient.get(getMembersBase());
      return (res.data ?? []).map(mapMemberListItem);
    } catch (error) {
      handleError(error, "Failed to fetch members");
      throw error;
    }
  },

  /* --------------------------- GET MEMBER BY ID --------------------------- */
  async getById(id: number): Promise<MemberDetailsDTO> {
    try {
      const res = await apiClient.get(`${getMembersBase()}/${id}`);
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to fetch member");
      throw error;
    }
  },

  /* ---------------------- GET BY NATIONAL ID ---------------------- */
  async getByNationalId(nationalId: string): Promise<MemberDetailsDTO> {
    try {
      const res = await apiClient.get(
        `${getMembersBase()}/national-id/${nationalId}`
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to fetch by national ID");
      throw error;
    }
  },

  /* ---------------------------- REGISTER MEMBER --------------------------- */
  async registerMember(
    payload: RegisterMemberRequestDTO
  ): Promise<MemberDetailsDTO> {
    try {
      const cleaned: RegisterMemberRequestDTO = {
        principal: {
          ...payload.principal,
          id: undefined,
        },
        nextOfKin: {
          ...payload.nextOfKin,
          id: undefined,
        },
        dependants: (payload.dependants ?? []).map((d: DependantDTO) => ({
          ...d,
          id: undefined,
        })),
      };

      const res = await apiClient.post(getRegisterBase(), cleaned);
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to register member");
      throw error;
    }
  },

  /* ------------------------ UPDATE PRINCIPAL ---------------------- */
  async patchPrincipal(
    id: number,
    data: Partial<PrincipalMemberDTO>
  ): Promise<MemberDetailsDTO> {
    try {
      const res = await apiClient.patch(
        `${getMembersBase()}/${id}`,
        data
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to update member");
      throw error;
    }
  },

  async updatePrincipal(
    id: number,
    data: PrincipalMemberDTO
  ): Promise<MemberDetailsDTO> {
    try {
      const res = await apiClient.put(
        `${getMembersBase()}/${id}`,
        data
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to update member");
      throw error;
    }
  },

  async deleteMember(id: number): Promise<void> {
    try {
      await apiClient.delete(`${getMembersBase()}/${id}`);
    } catch (error) {
      handleError(error, "Failed to delete member");
      throw error;
    }
  },

  /* ----------------------------- NEXT OF KIN ------------------------------ */
  async updateNextOfKin(
    principalId: number,
    data: NextOfKinDTO
  ): Promise<MemberDetailsDTO> {
    try {
      const res = await apiClient.put(
        `${getMembersBase()}/${principalId}/next-of-kin`,
        data
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to update next of kin");
      throw error;
    }
  },

  async patchNextOfKin(
    principalId: number,
    data: Partial<NextOfKinDTO>
  ): Promise<MemberDetailsDTO> {
    try {
      const res = await apiClient.patch(
        `${getMembersBase()}/${principalId}/next-of-kin`,
        data
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to patch next of kin");
      throw error;
    }
  },

  async deleteNextOfKin(principalId: number): Promise<MemberDetailsDTO> {
    try {
      const res = await apiClient.delete(
        `${getMembersBase()}/${principalId}/next-of-kin`
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to delete next of kin");
      throw error;
    }
  },

  /* ------------------------------ DEPENDANTS ------------------------------ */
  async addDependant(
    principalId: number,
    data: Omit<DependantDTO, "id">
  ): Promise<MemberDetailsDTO> {
    try {
      const res = await apiClient.post(
        `${getMembersBase()}/${principalId}/dependants`,
        data
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to add dependant");
      throw error;
    }
  },

  async patchDependant(
    principalId: number,
    dependantId: number,
    data: Partial<DependantDTO>
  ): Promise<MemberDetailsDTO> {
    try {
      const res = await apiClient.patch(
        `${getMembersBase()}/${principalId}/dependants/${dependantId}`,
        data
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to update dependant");
      throw error;
    }
  },

  async deleteDependant(
    principalId: number,
    dependantId: number
  ): Promise<MemberDetailsDTO> {
    try {
      const res = await apiClient.delete(
        `${getMembersBase()}/${principalId}/dependants/${dependantId}`
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to delete dependant");
      throw error;
    }
  },
};