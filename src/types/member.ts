export type UserRole = "facilitator" | "coordinator";

/**
 * Member Types (Frontend - Normalized)
 * This is the SINGLE SOURCE OF TRUTH for the UI
 */

/**
 * Principal Member (core identity)
 */
export interface PrincipalMember {
  id?: string;
  firstName: string;
  lastName: string;
  nationalID: string;
  phoneNumber: string;
  dateOfBirth: string;
  groupName: string;
}

/**
 * Next of Kin (single object per principal member)
 */
export interface NextOfKin {
  id?: string;
  firstName: string;
  lastName: string;
  relationship: string;
  idNumber: string;
  phoneNumber: string;
  dateOfBirth: string; // yyyy-MM-dd
  idAttachmentPath?: string;
}

/**
 * Dependant
 */
export interface Dependant {
  id?: string;
  firstName: string;
  lastName: string;
  relationship: string;
  gender: string;
  phoneNumber?: string;
  dateOfBirth: string;
  birthCertificatePath?: string;
}

/**
 * Member (FULL DETAILS VIEW)
 * Used when viewing a single member
 */
export interface MemberDetails {
  id: string;
  principal: PrincipalMember;
  nextOfKin: NextOfKin | null;
  dependants: Dependant[];
  registrationDate: string;
}

/**
 * Member (LIST VIEW - lightweight)
 * Used in tables, lists, search
 */
export interface MemberListItem {
  id: string;
  firstName: string;
  lastName: string;
  nationalID: string;
  phoneNumber: string;
  groupName: string;
  registrationDate: string;
}

export interface SystemUser {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  fullName: string;
}

/**
 * Registration payload (for creating new member)
 */
export interface RegisterMemberPayload {
  principal: PrincipalMember;
  nextOfKin: NextOfKin;
  dependants: Dependant[];
}

/**
 * API Response Wrapper (generic)
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * System User (for authentication)
 */
export interface SystemUser {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  fullName: string;
}
