import { apiClient, handleError } from "./client";
import type {
  CreateGroupTransferRequestDTO,
  GroupTransferRequestDTO,
  MemberGroupDTO,
} from "@/types/group";

const GROUP_TRANSFER_BASE = "/v1/group-transfers";

export const groupTransferApi = {
  async createRequest(
    groupId: number | string,
    payload: CreateGroupTransferRequestDTO
  ): Promise<GroupTransferRequestDTO> {
    try {
      const res = await apiClient.post<GroupTransferRequestDTO>(
        `${GROUP_TRANSFER_BASE}/groups/${groupId}`,
        payload
      );
      return res.data;
    } catch (error) {
      handleError(error, "Failed to request group transfer");
      throw error;
    }
  },

  async getHistory(): Promise<GroupTransferRequestDTO[]> {
    try {
      const res = await apiClient.get<GroupTransferRequestDTO[]>(
        `${GROUP_TRANSFER_BASE}/history`
      );
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      handleError(error, "Failed to load group transfer history");
      throw error;
    }
  },

  async approve(requestId: number | string): Promise<MemberGroupDTO> {
    try {
      const res = await apiClient.patch<MemberGroupDTO>(
        `${GROUP_TRANSFER_BASE}/${requestId}/approve`
      );
      return res.data;
    } catch (error) {
      handleError(error, "Failed to approve group transfer");
      throw error;
    }
  },
};
