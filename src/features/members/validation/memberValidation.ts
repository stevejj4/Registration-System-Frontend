import { DependantDTO, NextOfKinDTO, PrincipalMemberDTO, DependantFormData } from "@/types/member";
import { ERROR_MESSAGES, VALIDATION_RULES } from "@/constants";

export interface ValidationError {
  principalFirstName: string | null; // null means no error, string means error message
  principalLastName: string | null;
  principalNationalID: string | null;
  principalGender: string | null;
  principalPhoneNumber: string | null;
  principalDateOfBirth: string | null;
  principalGroupName: string | null;
  nextOfKinFirstName: string | null;
  nextOfKinLastName: string | null;
  nextOfKinRelationship: string | null;
  nextOfKinGender: string | null;
  nextOfKinIdNumber: string | null;
  nextOfKinPhoneNumber: string | null;
  nextOfKinDateOfBirth: string | null;
  general: string | null; // for errors that don't fit into specific fields (e.g. dependant errors) 
}

export const initialValidationError: ValidationError = {
  principalFirstName: null,
  principalLastName: null,
  principalNationalID: null,
  principalGender: null,
  principalPhoneNumber: null,
  principalDateOfBirth: null,
  principalGroupName: null,
  nextOfKinFirstName: null,
  nextOfKinLastName: null,
  nextOfKinRelationship: null,
  nextOfKinGender: null,
  nextOfKinIdNumber: null,
  nextOfKinPhoneNumber: null,
  nextOfKinDateOfBirth: null,
  general: null,
};

export function validatePrincipal(principal: PrincipalMemberDTO, errors: ValidationError): ValidationError {
  const newErrors = { ...errors };
  let isValid = true;

  // First name validation
  if (!principal.firstName.trim()) {
    newErrors.principalFirstName = "First name is required";
    isValid = false;
  } else if (principal.firstName.length < VALIDATION_RULES.MIN_NAME_LENGTH) {
    newErrors.principalFirstName = `First name must be at least ${VALIDATION_RULES.MIN_NAME_LENGTH} characters`;
    isValid = false;
  } else {
    newErrors.principalFirstName = null;
  }

  // Last name validation
  if (!principal.lastName.trim()) {
    newErrors.principalLastName = "Last name is required";
    isValid = false;
  } else if (principal.lastName.length < VALIDATION_RULES.MIN_NAME_LENGTH) {
    newErrors.principalLastName = `Last name must be at least ${VALIDATION_RULES.MIN_NAME_LENGTH} characters`;
    isValid = false;
  } else {
    newErrors.principalLastName = null;
  }

  // National ID validation
  if (!principal.nationalID.trim()) {
    newErrors.principalNationalID = "National ID is required";
    isValid = false;
  } else if (!VALIDATION_RULES.NATIONAL_ID_REGEX.test(principal.nationalID)) {
    newErrors.principalNationalID = ERROR_MESSAGES.INVALID_ID;
    isValid = false;
  } else {
    newErrors.principalNationalID = null;
  }

  // Phone number validation
  if (!principal.phoneNumber.trim()) {
    newErrors.principalPhoneNumber = "Phone number is required";
    isValid = false;
  } else if (!VALIDATION_RULES.PHONE_REGEX.test(principal.phoneNumber)) {
    newErrors.principalPhoneNumber = ERROR_MESSAGES.INVALID_PHONE;
    isValid = false;
  } else {
    newErrors.principalPhoneNumber = null;
  }

  // Date of birth validation
  if (!principal.dateOfBirth) {
    newErrors.principalDateOfBirth = "Date of birth is required";
    isValid = false;
  } else {
    newErrors.principalDateOfBirth = null;
  }

  // Group name validation
  if (!principal.groupName.trim()) {
    newErrors.principalGroupName = "Group name is required";
    isValid = false;
  } else {
    newErrors.principalGroupName = null;
  }

  // Gender validation
  if (!principal.gender.trim()) {
    newErrors.principalGender = "Gender is required";
    isValid = false;
  } else if (!["MALE", "FEMALE", "OTHER"].includes(principal.gender)) {
    newErrors.principalGender = "Invalid gender value";
    isValid = false;
  } else {
    newErrors.principalGender = null;
  }

  return newErrors;
}

export function validateNextOfKin(nextOfKin: NextOfKinDTO, errors: ValidationError): ValidationError {
  const newErrors = { ...errors };
  let isValid = true;

  // First name validation
  if (!nextOfKin.firstName.trim()) {
    newErrors.nextOfKinFirstName = "First name is required";
    isValid = false;
  } else if (nextOfKin.firstName.length < VALIDATION_RULES.MIN_NAME_LENGTH) {
    newErrors.nextOfKinFirstName = `First name must be at least ${VALIDATION_RULES.MIN_NAME_LENGTH} characters`;
    isValid = false;
  } else {
    newErrors.nextOfKinFirstName = null;
  }

  // Last name validation
  if (!nextOfKin.lastName.trim()) {
    newErrors.nextOfKinLastName = "Last name is required";
    isValid = false;
  } else if (nextOfKin.lastName.length < VALIDATION_RULES.MIN_NAME_LENGTH) {
    newErrors.nextOfKinLastName = `Last name must be at least ${VALIDATION_RULES.MIN_NAME_LENGTH} characters`;
    isValid = false;
  } else {
    newErrors.nextOfKinLastName = null;
  }

  // Relationship validation
  if (!nextOfKin.relationship.trim()) {
    newErrors.nextOfKinRelationship = "Relationship is required";
    isValid = false;
  } else {
    newErrors.nextOfKinRelationship = null;
  }

  // ID number validation
  if (!nextOfKin.idNumber.trim()) {
    newErrors.nextOfKinIdNumber = "ID number is required";
    isValid = false;
  } else {
    newErrors.nextOfKinIdNumber = null;
  }

  // Phone number validation
  if (!nextOfKin.phoneNumber.trim()) {
    newErrors.nextOfKinPhoneNumber = "Phone number is required";
    isValid = false;
  } else if (!VALIDATION_RULES.PHONE_REGEX.test(nextOfKin.phoneNumber)) {
    newErrors.nextOfKinPhoneNumber = ERROR_MESSAGES.INVALID_PHONE;
    isValid = false;
  } else {
    newErrors.nextOfKinPhoneNumber = null;
  }

  // Date of birth validation
  if (!nextOfKin.dateOfBirth) {
    newErrors.nextOfKinDateOfBirth = "Date of birth is required";
    isValid = false;
  } else {
    newErrors.nextOfKinDateOfBirth = null;
  }

  // Gender validation
  if (!nextOfKin.gender.trim()) {
    newErrors.nextOfKinGender = "Gender is required";
    isValid = false;
  } else if (!["MALE", "FEMALE", "OTHER"].includes(nextOfKin.gender)) {
    newErrors.nextOfKinGender = "Invalid gender value";
    isValid = false;
  } else {
    newErrors.nextOfKinGender = null;
  }

  return newErrors;
}

export function validateDependants(dependants: DependantDTO[], errors: ValidationError): ValidationError {
  const newErrors = { ...errors };

  // Clear general error initially
  newErrors.general = null;

  // Only validate dependants if there are any (dependants are optional)
  if (dependants.length > 0) {
    for (const dependant of dependants) {
      if (!dependant.firstName.trim() || !dependant.lastName.trim()) {
        newErrors.general = "All dependants must have first and last names";
        break;
      }

      if (!dependant.relationship.trim()) {
        newErrors.general = "All dependants must have a relationship";
        break;
      }

      if (!dependant.gender.trim()) {
        newErrors.general = "All dependants must have a gender";
        break;
      }

      if (dependant.phoneNumber && !VALIDATION_RULES.PHONE_REGEX.test(dependant.phoneNumber)) {
        newErrors.general = "Invalid phone number format for dependant";
        break;
      }

      if (!dependant.dateOfBirth) {
        newErrors.general = "All dependants must have a date of birth";
        break;
      }
    }
  }

  return newErrors;
}

export function isValidationErrorEmpty(errors: ValidationError): boolean {
  return Object.values(errors).every(value => value === null);
}
