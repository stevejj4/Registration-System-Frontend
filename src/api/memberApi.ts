import {
  MemberDetails,
  MemberListItem,
  RegisterMemberPayload,
  Dependant,
  NextOfKin,
  PrincipalMember,
} from "@/types/member";
import {
  mapMemberDetails,
  mapMemberListItem,
} from "@/features/members/mappers/memberMapper";
import { apiClient, handleError } from './client';
import { normalizeRole } from '@/utils/auth';

// ─────────────────────────────────────────────
// Internal helpers — not exported
// ─────────────────────────────────────────────

/**
 * Reads the stored auth user and resolves their normalized role string.
 * Throws immediately if the user is not authenticated or role is unresolvable,
 * so every API method fails loudly instead of silently routing to /auth.
 */
const getRole = (): string => {
  const raw = localStorage.getItem('auth_user');
  if (!raw) {
    throw new Error('Not authenticated — auth_user missing from storage');
  }

  let user: { role?: string; rawRole?: string } | null = null;
  try {
    user = JSON.parse(raw);
  } catch {
    throw new Error('Malformed auth_user in storage');
  }

  const candidate = user?.rawRole ?? user?.role;
  const role = normalizeRole(candidate);

  if (!role) {
    throw new Error(`Unresolvable role: "${candidate}"`);
  }

  return role; // e.g. 'facilitator' | 'coordinator' | 'admin'
};

/**
 * Returns the role-scoped members base path.
 * e.g. /facilitator/members | /coordinator/members | /admin/members
 *
 * apiClient.baseURL already includes /api, so paths here are relative to that.
 */
const getMembersBase = (): string => `/${getRole()}/members`;

/**
 * Returns the correct registration endpoint per role.
 *
 * Admin registers system users (facilitators / coordinators) via a separate path.
 * Facilitator and Coordinator register principal members via their members path.
 */
const getRegisterBase = (): string => {
  const role = getRole();
  if (role === 'admin') return '/admin/user/register';
  return `/${role}/members/register`;
};

// ─────────────────────────────────────────────
// Member API
// ─────────────────────────────────────────────

/**
 * MEMBER API
 *
 * Bridge between the frontend and backend for all member-related operations.
 * Encapsulates HTTP requests, data transformation, and error handling in one
 * place for consistency across the application.
 *
 * Every method:
 *  - Uses apiClient (Axios instance) for HTTP communication
 *  - Calls handleError() on failure for consistent error messaging
 *  - Maps raw backend data to typed frontend models via memberMapper
 */
export const memberApi = {

  // ── LIST ──────────────────────────────────────────────────────────────────

  /**
   * Fetch all members (list view).
   * Routes to /{role}/members — e.g. /facilitator/members
   */
  async getAll(): Promise<MemberListItem[]> {
    try {
      const res = await apiClient.get(getMembersBase());
      return res.data.map(mapMemberListItem);
    } catch (error) {
      handleError(error, "Failed to fetch members");
      throw error;
    }
  },

  // ── SINGLE MEMBER ─────────────────────────────────────────────────────────

  /**
   * Fetch detailed information for a single member by their system ID.
   * Routes to /{role}/members/{id}
   */
  async getById(id: string): Promise<MemberDetails> {
    try {
      const res = await apiClient.get(`${getMembersBase()}/${id}`);
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to fetch member details");
      throw error;
    }
  },

  /**
   * Fetch a member by their National ID.
   * Routes to /{role}/members/national-id/{nationalId}
   */
  async getByNationalId(nationalId: string): Promise<MemberDetails> {
    if (!nationalId) {
      throw new Error("National ID is required");
    }
    try {
      const res = await apiClient.get(`${getMembersBase()}/national-id/${nationalId}`);
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to fetch member by National ID");
      throw error;
    }
  },

  // ── REGISTRATION ──────────────────────────────────────────────────────────

  /**
   * Register a new principal member (facilitator / coordinator)
   * or a new system user account (admin).
   *
   * Facilitator  → /facilitator/members/register
   * Coordinator  → /coordinator/members/register
   * Admin        → /admin/user/register
   *
   * Strips client-side generated IDs before sending to the backend.
   */
  async registerMember(payload: RegisterMemberPayload): Promise<MemberDetails> {
    try {
      const backendPayload = {
        principal: {
          ...payload.principal,
          id: undefined, // backend generates the ID
        },
        nextOfKin: {
          ...payload.nextOfKin,
          id: undefined,
        },
        dependants: (payload.dependants ?? []).map(({ id, ...rest }) => rest),
      };

      const res = await apiClient.post(getRegisterBase(), backendPayload);
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to register member");
      throw error;
    }
  },

  // ── PRINCIPAL MEMBER ──────────────────────────────────────────────────────

  /**
   * Partially update a principal member's fields (PATCH — send only changed fields).
   * Routes to /{role}/members/{id}
   */
  async patchPrincipal(
    id: string,
    data: Partial<PrincipalMember>
  ): Promise<MemberDetails> {
    try {
      const res = await apiClient.patch(`${getMembersBase()}/${id}`, data);
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to patch principal member");
      throw error;
    }
  },

  /**
   * Fully replace a principal member's record (PUT — send all fields).
   * Routes to /{role}/members/{id}
   */
  async updatePrincipal(
    id: string,
    data: PrincipalMember
  ): Promise<MemberDetails> {
    try {
      const res = await apiClient.put(`${getMembersBase()}/${id}`, data);
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to update principal member");
      throw error;
    }
  },

  /**
   * Delete a principal member.
   * Backend is expected to cascade-delete dependants and next of kin.
   * Routes to /{role}/members/{id}
   */
  async deleteMember(id: string): Promise<void> {
    try {
      await apiClient.delete(`${getMembersBase()}/${id}`);
    } catch (error) {
      handleError(error, "Failed to delete member");
      throw error;
    }
  },

  // ── NEXT OF KIN ───────────────────────────────────────────────────────────

  /**
   * Fully replace next of kin (PUT — all fields required).
   * Routes to /{role}/members/{principalId}/next-of-kin
   */
  async updateNextOfKin(
    principalId: string,
    data: NextOfKin
  ): Promise<MemberDetails> {
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

  /**
   * Partially update next of kin fields (PATCH — send only changed fields).
   * Routes to /{role}/members/{principalId}/next-of-kin
   */
  async patchNextOfKin(
    principalId: string,
    data: Partial<NextOfKin>
  ): Promise<MemberDetails> {
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

  /**
   * Delete next of kin for a principal member.
   * Routes to /{role}/members/{principalId}/next-of-kin
   */
  async deleteNextOfKin(principalId: string): Promise<MemberDetails> {
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

  // ── DEPENDANTS ────────────────────────────────────────────────────────────

  /**
   * Add a new dependant to a principal member.
   * Backend generates the dependant ID — we omit it from the payload.
   * Routes to /{role}/members/{principalId}/dependants
   */
  async addDependant(
    principalId: string,
    data: Omit<Dependant, "id">
  ): Promise<MemberDetails> {
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

  /**
   * Partially update a dependant's fields.
   * Requires principalId to scope the request correctly and match the backend
   * route pattern used by all other dependant operations.
   * Routes to /{role}/members/{principalId}/dependants/{dependantId}
   */
  async patchDependant(
    principalId: string,
    dependantId: string,
    data: Partial<Dependant>
  ): Promise<MemberDetails> {
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

  /**
   * Delete a dependant from a principal member.
   * Routes to /{role}/members/{principalId}/dependants/{dependantId}
   */
  async deleteDependant(
    principalId: string,
    dependantId: string
  ): Promise<MemberDetails> {
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