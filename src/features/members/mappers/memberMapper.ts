// src/features/members/mappers/memberMapper.ts

/**
 * Member Mapper
 *
 * Converts raw backend API responses into strongly typed frontend DTOs.
 *
 * Why this exists:
 * - Protects the UI from malformed backend responses
 * - Centralizes transformation logic
 * - Keeps components clean
 * - Allows backend and frontend to evolve independently
 * - Prevents runtime crashes caused by null/undefined values
 */

import type {
  DependantDTO,
  MemberDetailsDTO,
  MemberListItemDTO,
  NextOfKinDTO,
  PrincipalMemberDTO,
} from "@/types/member";

import type {
  GenderType,
  RelationshipType,
} from "@/types/enums";

/* -------------------------------------------------------------------------- */
/*                               SAFE UTILITIES                               */
/* -------------------------------------------------------------------------- */

/**
 * Safely converts any value to string
 */
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

/**
 * Safely converts value to optional string
 */
const safeOptionalString = (
  value: unknown
): string | undefined => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return undefined;
  }

  return String(value);
};

/**
 * Safely converts value to number
 */
const safeNumber = (
  value: unknown
): number | undefined => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed)
    ? undefined
    : parsed;
};

/**
 * Safely maps gender enum
 */
const safeGender = (
  value: unknown
): GenderType => {
  const gender = safeString(value).toUpperCase();

  switch (gender) {
    case "MALE":
      return "MALE";

    case "FEMALE":
      return "FEMALE";

    default:
      return "OTHER";
  }
};

/**
 * Safely maps relationship enum
 */
const safeRelationship = (
  value: unknown
): RelationshipType => {
  const relationship = safeString(value).toUpperCase();

  switch (relationship) {
    case "SPOUSE":
      return "SPOUSE";

    case "SON":
      return "SON";

    case "DAUGHTER":
      return "DAUGHTER";

    case "PARENT":
      return "PARENT";

    default:
      return "OTHER";
  }
};

/* -------------------------------------------------------------------------- */
/*                          PRINCIPAL MEMBER MAPPER                           */
/* -------------------------------------------------------------------------- */

export function mapPrincipalMember(
  api: any
): PrincipalMemberDTO {
  return {
    id: safeNumber(api?.id),

    firstName: safeString(api?.firstName),

    lastName: safeString(api?.lastName),

    nationalID: safeString(api?.nationalID),

    gender: safeGender(api?.gender),

    phoneNumber: safeString(api?.phoneNumber),

    groupName: safeString(api?.groupName),

    dateOfBirth: safeString(api?.dateOfBirth),

    registrationDate: safeString(api?.registrationDate),

    registeredByName: safeOptionalString(api?.registeredByName),

    registeredByRole: safeOptionalString(api?.registeredByRole),
  };
}

/* -------------------------------------------------------------------------- */
/*                            NEXT OF KIN MAPPER                              */
/* -------------------------------------------------------------------------- */

export function mapNextOfKin(
  api: any
): NextOfKinDTO | null {
  if (!api || typeof api !== "object") {
    return null;
  }

  return {
    id: safeNumber(api?.id),

    firstName: safeString(api?.firstName),

    lastName: safeString(api?.lastName),

    relationship: safeRelationship(
      api?.relationship
    ),

    gender: safeGender(api?.gender),

    idNumber: safeString(api?.idNumber),

    phoneNumber: safeString(api?.phoneNumber),

    dateOfBirth: safeString(api?.dateOfBirth),

    idAttachmentPath: safeOptionalString(
      api?.idAttachmentPath
    ),
  };
}

/* -------------------------------------------------------------------------- */
/*                             DEPENDANT MAPPER                               */
/* -------------------------------------------------------------------------- */

export function mapDependant(
  api: any
): DependantDTO {
  return {
    id: safeNumber(api?.id),

    firstName: safeString(api?.firstName),

    lastName: safeString(api?.lastName),

    relationship: safeRelationship(
      api?.relationship
    ),

    gender: safeGender(api?.gender),

    phoneNumber: safeOptionalString(
      api?.phoneNumber
    ),

    dateOfBirth: safeString(api?.dateOfBirth),

    birthCertificatePath:
      safeOptionalString(
        api?.birthCertificatePath
      ),
  };
}

/* -------------------------------------------------------------------------- */
/*                          MEMBER DETAILS MAPPER                             */
/* -------------------------------------------------------------------------- */

export function mapMemberDetails(
  api: any
): MemberDetailsDTO {
  /**
   * Defensive validation
   */
  if (!api || typeof api !== "object") {
    console.warn(
      "Invalid API response provided to mapMemberDetails:",
      api
    );

    api = {};
  }

  /**
   * Backend may return:
   * {
   *   principal: {}
   * }
   *
   * OR
   *
   * {
   *   member: {}
   * }
   */
  const principalData =
    api?.principal ||
    api?.member ||
    {};

  /**
   * Some backends mistakenly return
   * nextOfKin as array instead of object
   */
  const nextOfKinData = Array.isArray(
    api?.nextOfKin
  )
    ? api.nextOfKin[0]
    : api?.nextOfKin;

  return {
    principal:
      mapPrincipalMember(
        principalData
      ),

    nextOfKin:
      mapNextOfKin(
        nextOfKinData
      ),

    dependants: Array.isArray(
      api?.dependants
    )
      ? api.dependants.map(
          mapDependant
        )
      : [],
  };
}

/* -------------------------------------------------------------------------- */
/*                         MEMBER LIST ITEM MAPPER                            */
/* -------------------------------------------------------------------------- */

export function mapMemberListItem(
  api: any
): MemberListItemDTO {
  if (!api || typeof api !== "object") {
    console.warn(
      "Invalid API response provided to mapMemberListItem:",
      api
    );

    api = {};
  }

  /**
   * Backend may return nested member object
   * or flat object
   */
  const memberData =
    api?.member || api?.principal || api;

  const registrationRaw =
    memberData?.registrationDate ??
    api?.registrationDate ??
    memberData?.createdAt;

  return {
    id:
      safeNumber(
        memberData?.id
      ) || 0,

    firstName: safeString(
      memberData?.firstName
    ),

    lastName: safeString(
      memberData?.lastName
    ),

    nationalID: safeString(
      memberData?.nationalID
    ),

    gender: safeGender(
      memberData?.gender
    ),

    phoneNumber: safeString(
      memberData?.phoneNumber
    ),

    groupName: safeString(
      memberData?.groupName
    ),

    registrationDate: safeString(registrationRaw),

    registeredByName: safeString(
      memberData?.registeredByName ?? api?.registeredByName
    ),

    registeredByRole: safeString(
      memberData?.registeredByRole ?? api?.registeredByRole
    ),
  };
}