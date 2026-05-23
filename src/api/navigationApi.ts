import { apiClient, handleError } from "./client";
import type { NavigationItemDTO } from "@/types/navigation";

export const navigationApi = {
  async getNavigation(): Promise<NavigationItemDTO[]> {
    try {
      const res = await apiClient.get<NavigationItemDTO[]>("/v1/me/navigation");
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      handleError(error, "Failed to load navigation");
      throw error;
    }
  },
};
