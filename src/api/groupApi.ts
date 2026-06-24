import { apiClient, handleError } from "./client";
import axios from "axios";
import type { CreateGroupRequestDTO, GroupDetailsDTO, MemberGroupDTO } from "@/types/group";

export const groupApi = {
  async createGroup(payload: CreateGroupRequestDTO): Promise<MemberGroupDTO> {
    try {
      const res = await apiClient.post<MemberGroupDTO>("/v1/groups", payload);
      return res.data;
    } catch (error) {
      handleError(error, "Failed to create group");
      throw error;
    }
  },

  async getGroups(params: { wardId: number }): Promise<MemberGroupDTO[]> {
    try {
      const res = await apiClient.get<MemberGroupDTO[]>("/v1/groups", {
        params,
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        throw new Error("You are not allowed to view groups for this ward.");
      }
      handleError(error, "Failed to load groups");
      throw error;
    }
  },

  async getGroupDetails(id: number | string): Promise<GroupDetailsDTO> {
    try {
      const res = await apiClient.get<GroupDetailsDTO>(`/v1/groups/${id}`);
      return {
        group: res.data.group,
        totalMembers: Number(res.data.totalMembers ?? 0),
        members: Array.isArray(res.data.members) ? res.data.members : [],
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        throw new Error("You are not allowed to view this group.");
      }
      handleError(error, "Failed to load group details");
      throw error;
    }
  },
};
