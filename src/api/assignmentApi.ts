import { apiClient, handleError } from "./client";
import type { AssignmentDTO } from "@/types/auth";
import type { WardDTO } from "@/types/location";

export const assignmentApi = {
  async getMyAssignment(): Promise<AssignmentDTO> {
    try {
      const res = await apiClient.get<AssignmentDTO>("/v1/me/assignment");
      return {
        ...res.data,
        wardIds: res.data.wardIds ?? [],
        wardNames: res.data.wardNames ?? [],
      };
    } catch (error) {
      handleError(error, "Failed to load user assignment");
      throw error;
    }
  },

  async getMyWards(): Promise<WardDTO[]> {
    try {
      const res = await apiClient.get<WardDTO[]>("/v1/me/wards");
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      handleError(error, "Failed to load assigned wards");
      throw error;
    }
  },
};
