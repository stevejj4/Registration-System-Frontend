import {
  MemberDetails,
  MemberListItem,
  RegisterMemberPayload,
  Dependant,
  NextOfKin,
  SystemUser,
  PrincipalMember,
} from "@/types/member"; // the blueprint for our member data structures
import {
  mapMemberDetails,
  mapMemberListItem,
} from "@/features/members/mappers/memberMapper"; // translators to convert backend data to our frontend types
import { apiClient, handleError } from "./client"; // communication layer with the backend, including error handling logic

/**
 * MEMBER API
 * bridge between our frontend and backend for all member-related operations
 * encapsulates all HTTP requests and responses, providing a clean interface for the rest of the app
 * handles data transformation and error handling in one place for consistency
 */
export const memberApi = {
  /**
   * Get all members (LIST VIEW)
   */
  async getAll(): Promise<MemberListItem[]> {
    try {
      const res = await apiClient.get("/members");
      return res.data.map(mapMemberListItem);
    } catch (error) {
      handleError(error, "Failed to fetch members");
    }
  },

  /**
   * Get member by ID
   */
  async getById(id: string): Promise<MemberDetails> {
    try {
      const res = await apiClient.get(`/members/${id}`);
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to fetch member details");
    }
  },

  /**
   * Get member by National ID
   */
  async getByNationalId(nationalId: string): Promise<MemberDetails> {
    if (!nationalId) {
      throw new Error("National ID is required");
    }

    try {
      const res = await apiClient.get(
        `/members/national-id/${nationalId}` 
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to fetch member details");
    }
  },

  // Add a new member to the system
  async registerMember(
    payload: RegisterMemberPayload
  ): Promise<MemberDetails> {
    try {
      const backendPayload = {
        principal: payload.principal,
        nextOfKin: payload.nextOfKin, // backend wants this as a single object, not array
        dependants: payload.dependants || []
      };

      const res = await apiClient.post("/members/register", backendPayload);
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to register member");
      throw error; // let the UI handle the error
    }
  },

  // Update a member's basic info
  async updatePrincipal(
    id: string,
    data: Partial<PrincipalMember>
  ): Promise<MemberDetails> {
    try {
      const res = await apiClient.patch(`/members/${id}`, data);
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to update member");
      throw error;
    }
  },

  // Next of Kin related methods

  // Update next of kin info (replace all fields)
  async updateNextOfKin(
    principalId: string,
    data: NextOfKin
  ): Promise<MemberDetails> {
    try {
      const res = await apiClient.put(
        `/members/${principalId}/next-of-kin`,
        data
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to update next of kin");
      throw error;
    }
  },

  // Update some next of kin fields (partial update)
  async patchNextOfKin(
    principalId: string,
    data: Partial<NextOfKin>
  ): Promise<MemberDetails> {
    try {
      const res = await apiClient.patch(
        `/members/${principalId}/next-of-kin`,
        data
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      console.error("Next of Kin patch failed:", error.response?.data || error);
      handleError(error, "Failed to patch next of kin");
      throw error;
    }
  },

  /**
   * DEPENDANTS
   */

  async addDependant(
    principalId: string,
    data: Omit<Dependant, "id">
  ): Promise<MemberDetails> {
    try {
      const res = await apiClient.post(
        `/members/${principalId}/dependants`,
        data
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to add dependant");
    }
  },

  async updateDependant(
    dependantId: string,
    data: Partial<Dependant>
  ): Promise<void> {
    try {
      await apiClient.patch(
        `/members/dependants/${dependantId}`,
        data
      );
    } catch (error) {
      handleError(error, "Failed to update dependant");
    }
  },

  async deleteDependant(
    principalId: string,
    dependantId: string
  ): Promise<MemberDetails> {
    try {
      const res = await apiClient.delete(
        `/members/${principalId}/dependants/${dependantId}` 
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to delete dependant");
    }
  },

  /**
   * AUTH
   */

  async signup(data: Omit<SystemUser, "id">): Promise<SystemUser> {
    try {
      const res = await apiClient.post("/signup", data);
      return res.data;
    } catch (error) {
      handleError(error, "Sign up failed");
    }
  },
};
