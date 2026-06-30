import { apiClient, handleError } from "./client";
import axios from "axios";
import type { CreateGroupRequestDTO, GroupDetailsDTO, MemberGroupDTO } from "@/types/group";
/**
 * API service for managing member related operatons.
 * 
 * ### Application Usage:
 * --- **Creating a Group**: Use `createGroup` to create a new member group by providing the necessary details in the payload.
 * --- **Fetching Groups**: Use `getGroups` to retrieve a list of member groups associated with a specific ward by providing the ward ID as a parameter.
 * --- **Fetching Group Details**: Use `getGroupDetails` to retrieve detailed information about a specific member group by providing the group ID.
 * --- 'MeberRegistration.tsx' : imported and referenced (around line 413) during member onboarding.
 * --- TransferApproval.tsx: Uses `getGroupDetails` to fetch group details for transfer approval.
 * 
 * ### Error Handling:
 */


export const groupApi = {
  /**
   * Creates a new member group.
   * @usedIn: 'MemberRegistration.tsx' for creating a group during member onboarding.
   * @param payload - The details of the group to be created.
   * @returns A promise that resolves to the created MemberGroupDTO.
   * @throws An error if the group creation fails.
   */
  async createGroup(payload: CreateGroupRequestDTO): Promise<MemberGroupDTO> {
    try {
      const res = await apiClient.post<MemberGroupDTO>("/v1/groups", payload);
      return res.data;
    } catch (error) {
      handleError(error, "Failed to create group");
      throw error;
    }
  },
/**
 * **
 * Fetches a List of groups filtered by a specific ward ID
 * 
 * @usedIn: 'MemberRegistration.tsx' for fetching groups during member onboarding.
 * @param params - An object containing the ward ID to filter groups.
 * @param {object} params - The parameters for fetching groups, including the ward ID.
 * @param {number} params.wardId - The ID of the ward for which to fetch groups.
 * @returns {Promise<MemberGroupDTO[]>} A promise that resolves to an array of MemberGroupDTOs.
 * @throws {Error} An error if the group retrieval fails or if the user is not authorized to view groups for the specified ward.
 * @returns A promise that resolves to an array of MemberGroupDTOs.
 * @throws An error if the group retrieval fails or if the user is not authorized to view groups for the specified ward.
 */
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
  /**
   * Retrieves comprehensive details for a single group, including its members and total member count.
   * @usedIn: 'TransferApproval.tsx' for fetching group details during transfer approval.
   * @param id - The ID of the group for which to fetch details.
   * @returns A promise that resolves to a GroupDetailsDTO containing the group's details, total members, and member list.
   * @throws An error if the group details retrieval fails or if the user is not authorized to view the specified group.
   */
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
