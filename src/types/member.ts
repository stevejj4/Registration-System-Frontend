// src/types/member.ts

import {
  GenderType,
  RelationshipType,
} from "./enums";

/**
 * Principal Member DTO
 */
export interface PrincipalMemberDTO {
  id?: number;

  firstName: string;

  lastName: string;

  nationalID: string;

  gender: GenderType;

  phoneNumber: string;

  groupName?: string;

  dateOfBirth: string; // yyyy-MM-dd
}

/**
 * Next Of Kin DTO
 */
export interface NextOfKinDTO {
  id?: number;

  firstName: string;

  lastName: string;

  relationship: RelationshipType;

  gender: GenderType;

  idNumber: string;

  phoneNumber: string;

  dateOfBirth: string;

  idAttachmentPath?: string | File | null;
}

/**
 * Dependant DTO
 */
export interface DependantDTO {
  id?: number;

  firstName: string;

  lastName: string;

  relationship: RelationshipType;

  gender: GenderType;

  phoneNumber?: string;

  dateOfBirth: string;

  birthCertificatePath?: string | File | null;
}

/**
 * Register Member Request
 */
export interface RegisterMemberRequestDTO {
  principal: PrincipalMemberDTO;

  nextOfKin: NextOfKinDTO;

  dependants: DependantDTO[];
}

/**
 * Full Member Details Response
 * Backend serializes the principal as `member`; the mapper accepts both `member` and `principal`.
 */
export interface MemberDetailsDTO {
  principal: PrincipalMemberDTO;

  nextOfKin: NextOfKinDTO | null;

  dependants: DependantDTO[];
}

/** @deprecated Use MemberDetailsDTO — kept for legacy imports */
export type MemberDetails = MemberDetailsDTO;

/**
 * Member List Item
 * Lightweight table/list view
 */
export interface MemberListItemDTO {
  id: number;

  firstName: string;

  lastName: string;

  nationalID: string;

  gender: GenderType;

  phoneNumber: string;

  groupName?: string;

  registrationDate: string;
}

/* -------------------------------------------------------------------------- */
/*                           TYPE ALIASES FOR FORMS                           */
/* -------------------------------------------------------------------------- */

/**
 * Type alias for PrincipalMemberDTO
 * Used in form components
 */
export type PrincipalMember = PrincipalMemberDTO;

/**
 * Type alias for NextOfKinDTO
 * Used in form components
 */
export type NextOfKin = NextOfKinDTO;

/**
 * Form-specific Dependant type
 * Allows string IDs (for temporary form state) and empty strings for enums
 */
export interface DependantFormData {
  id: string; // Use string for form state (generated from Date.now().toString())

  firstName: string;

  lastName: string;

  relationship: RelationshipType | ""; // Allow empty string during form editing

  gender: GenderType | ""; // Allow empty string during form editing

  phoneNumber?: string;

  dateOfBirth: string;

  birthCertificatePath?: string | File | null;
}

/**
 * Type alias for DependantFormData
 * Used in DependantsForm component
 */
export type Dependant = DependantFormData;

/**
 * Type alias for RegisterMemberRequestDTO
 * Used in form submission
 */
export type RegisterMemberPayload = RegisterMemberRequestDTO;