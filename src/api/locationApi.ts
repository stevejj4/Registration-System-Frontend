import { apiClient, handleError } from "./client";
import type { CountyDTO, SubCountyDTO, WardDTO } from "@/types/location";

export const locationApi = {
  async getCounties(): Promise<CountyDTO[]> {
    try {
      const res = await apiClient.get<CountyDTO[]>("/v1/locations/counties");
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      handleError(error, "Failed to load counties");
      throw error;
    }
  },

  async getSubCounties(countyId: number): Promise<SubCountyDTO[]> {
    try {
      const res = await apiClient.get<SubCountyDTO[]>(
        "/v1/locations/sub-counties",
        { params: { countyId } }
      );
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      handleError(error, "Failed to load sub-counties");
      throw error;
    }
  },

  async getWards(subCountyId: number): Promise<WardDTO[]> {
    try {
      const res = await apiClient.get<WardDTO[]>("/v1/locations/wards", {
        params: { subCountyId },
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      handleError(error, "Failed to load wards");
      throw error;
    }
  },
};
