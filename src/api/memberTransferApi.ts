import { apiClient, handleError } from "./client";
import { mapMemberDetails } from "@/features/members/mappers/memberMapper";
import type {
  MemberDetailsDTO,
  MemberTransferRequestDTO,
  TransferMemberRequestDTO,
  ApproveMemberTransferRequestDTO,
} from "@/types/member";

const TRANSFER_BASE = "/v1/member-transfers";

export const memberTransferApi = {
  async createRequest(
    memberId: number | string,
    payload: TransferMemberRequestDTO
  ): Promise<MemberTransferRequestDTO> {
    try {
      const res = await apiClient.post<MemberTransferRequestDTO>(
        `${TRANSFER_BASE}/members/${memberId}`,
        payload
      );
      return res.data;
    } catch (error) {
      handleError(error, "Failed to request member transfer");
      throw error;
    }
  },

  async getHistory(): Promise<MemberTransferRequestDTO[]> {
    try {
      const res = await apiClient.get<MemberTransferRequestDTO[]>(
        `${TRANSFER_BASE}/history`
      );
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      handleError(error, "Failed to load transfer requests");
      throw error;
    }
  },

  async approve(
    requestId: number | string,
    payload: ApproveMemberTransferRequestDTO
  ): Promise<MemberDetailsDTO> {
    try {
      const res = await apiClient.patch(
        `${TRANSFER_BASE}/${requestId}/approve`,
        payload
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to approve transfer");
      throw error;
    }
  },
};
