// src/utils/memberUtils.ts

import type { MemberListItemDTO } from "@/types/member";
import type { GenderType, RelationshipType } from "@/types/enums";

/* -------------------------------------------------------------------------- */
/*                                DATE FORMAT                                 */
/* -------------------------------------------------------------------------- */

export const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/* -------------------------------------------------------------------------- */
/*                              PHONE FORMATTING                              */
/* -------------------------------------------------------------------------- */

export const formatPhoneNumber = (
  phone?: string
): string => {
  if (!phone) return "N/A";

  // Kenyan format: 07XX XXX XXX
  if (phone.startsWith("07") && phone.length === 10) {
    return `${phone.slice(0, 4)} ${phone.slice(
      4,
      7
    )} ${phone.slice(7)}`;
  }

  return phone;
};

/* -------------------------------------------------------------------------- */
/*                                VALIDATIONS                                 */
/* -------------------------------------------------------------------------- */

export const validateNationalId = (
  id?: string
): boolean => {
  if (!id) return false;

  // Kenyan ID: 7–8 digits (some systems vary)
  return /^\d{7,10}$/.test(id);
};

export const validatePhoneNumber = (
  phone?: string
): boolean => {
  if (!phone) return false;

  return /^07\d{8}$/.test(phone);
};

/* -------------------------------------------------------------------------- */
/*                                 AGE LOGIC                                  */
/* -------------------------------------------------------------------------- */

export const calculateAge = (
  dateOfBirth?: string
): number => {
  if (!dateOfBirth) return 0;

  const birth = new Date(dateOfBirth);

  if (isNaN(birth.getTime())) {
    return 0;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    birth.getFullYear();

  const monthDiff =
    today.getMonth() -
    birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 &&
      today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
};

/* -------------------------------------------------------------------------- */
/*                               NAME HELPERS                                 */
/* -------------------------------------------------------------------------- */

export const formatMemberName = (member: {
  firstName?: string;
  lastName?: string;
}): string => {
  return (
    `${member.firstName ?? ""} ${
      member.lastName ?? ""
    }`.trim() || "N/A"
  );
};

export const formatMemberDisplay = (
  member: MemberListItemDTO
): string => {
  return `${member.firstName} ${member.lastName} (${member.nationalID})`;
};

/* -------------------------------------------------------------------------- */
/*                               SORTING LOGIC                                */
/* -------------------------------------------------------------------------- */

export const sortMembersByName = (
  members: MemberListItemDTO[]
): MemberListItemDTO[] => {
  return [...members].sort((a, b) =>
    `${a.firstName} ${a.lastName}`.localeCompare(
      `${b.firstName} ${b.lastName}`
    )
  );
};

/* -------------------------------------------------------------------------- */
/*                               FILTER LOGIC                                 */
/* -------------------------------------------------------------------------- */

export const filterMembers = (
  members: MemberListItemDTO[],
  searchTerm: string
): MemberListItemDTO[] => {
  if (!searchTerm.trim()) return members;

  const term = searchTerm.toLowerCase();

  return members.filter((member) => {
    return (
      `${member.firstName} ${member.lastName}`
        .toLowerCase()
        .includes(term) ||
      member.nationalID
        .toLowerCase()
        .includes(term) ||
      member.phoneNumber
        .toLowerCase()
        .includes(term) ||
      member.groupName?.toLowerCase()
        .toLowerCase()
        .includes(term)
    );
  });
};

/* -------------------------------------------------------------------------- */
/*                            ENUM DISPLAY HELPERS                            */
/* -------------------------------------------------------------------------- */

/**
 * Converts GenderType (MALE, FEMALE, OTHER) to display text (Male, Female, Other)
 */
export const genderToDisplayText = (gender: GenderType | string): string => {
  const normalized = String(gender).toUpperCase();
  const mapping: Record<string, string> = {
    MALE: "Male",
    FEMALE: "Female",
    OTHER: "Other",
  };
  return mapping[normalized] || "Unknown";
};

/**
 * Converts display text (Male, Female, Other) to GenderType (MALE, FEMALE, OTHER)
 */
export const displayTextToGender = (text: string): GenderType => {
  const normalized = text.toUpperCase();
  const mapping: Record<string, GenderType> = {
    MALE: "MALE",
    FEMALE: "FEMALE",
    OTHER: "OTHER",
  };
  return mapping[normalized] || "OTHER";
};

/**
 * Converts RelationshipType to display text
 * SPOUSE -> Spouse, SON -> Son, DAUGHTER -> Daughter, PARENT -> Parent, OTHER -> Other
 */
export const relationshipToDisplayText = (relationship: RelationshipType | string): string => {
  const normalized = String(relationship).toUpperCase();
  const mapping: Record<string, string> = {
    SPOUSE: "Spouse",
    SON: "Son",
    DAUGHTER: "Daughter",
    PARENT: "Parent",
    OTHER: "Other",
  };
  return mapping[normalized] || "Unknown";
};

/**
 * Converts display text to RelationshipType
 * Spouse -> SPOUSE, Son -> SON, Daughter -> DAUGHTER, Parent -> PARENT, Other -> OTHER
 */
export const displayTextToRelationship = (text: string): RelationshipType => {
  const normalized = text.toUpperCase();
  const mapping: Record<string, RelationshipType> = {
    SPOUSE: "SPOUSE",
    SON: "SON",
    DAUGHTER: "DAUGHTER",
    PARENT: "PARENT",
    OTHER: "OTHER",
  };
  return mapping[normalized] || "OTHER";
};