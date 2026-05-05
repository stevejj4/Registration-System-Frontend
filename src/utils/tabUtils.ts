import { MemberDetails, NextOfKin, Dependant, MemberListItem } from '@/types/member';

// Common form field configurations
export const FORM_FIELDS = {
  principal: {
    firstName: { label: 'First Name', type: 'text', required: true },
    lastName: { label: 'Last Name', type: 'text', required: true },
    nationalID: { label: 'National ID', type: 'text', required: true },
    phoneNumber: { label: 'Phone Number', type: 'tel', required: true },
    dateOfBirth: { label: 'Date of Birth', type: 'date', required: true },
    groupName: { label: 'Group Name', type: 'select', required: true, options: ['Group A', 'Group B', 'Group C'] },
  },
  nextOfKin: {
    firstName: { label: 'First Name', type: 'text', required: true },
    lastName: { label: 'Last Name', type: 'text', required: true },
    relationship: { label: 'Relationship', type: 'select', required: true, options: ['Son', 'Daughter', 'Spouse', 'Brother', 'Sister', 'Parent', 'In-law', 'Other'] },
    phoneNumber: { label: 'Phone Number', type: 'tel', required: true },
    idNumber: { label: 'ID Number', type: 'text', required: true },
    dateOfBirth: { label: 'Date of Birth', type: 'date', required: true },
  },
  dependant: {
    firstName: { label: 'First Name', type: 'text', required: true },
    lastName: { label: 'Last Name', type: 'text', required: true },
    relationship: { label: 'Relationship', type: 'select', required: true, options: ['Son', 'Daughter', 'Spouse'] },
    gender: { label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Others'] },
    phoneNumber: { label: 'Phone Number (Optional)', type: 'tel', required: false },
    dateOfBirth: { label: 'Date of Birth', type: 'date', required: true },
  },
} as const;

// Common form state initializers
export const getInitialFormState = {
  principal: (member: MemberDetails) => ({
    firstName: member.principal?.firstName || '',
    lastName: member.principal?.lastName || '',
    nationalID: member.principal?.nationalID || '',
    phoneNumber: member.principal?.phoneNumber || '',
    dateOfBirth: member.principal?.dateOfBirth || '',
    groupName: member.principal?.groupName || '',
  }),
  nextOfKin: (member: MemberDetails) => ({
    firstName: member.nextOfKin?.firstName || '',
    lastName: member.nextOfKin?.lastName || '',
    relationship: member.nextOfKin?.relationship || '',
    phoneNumber: member.nextOfKin?.phoneNumber || '',
    idNumber: member.nextOfKin?.idNumber || '',
    dateOfBirth: member.nextOfKin?.dateOfBirth || '',
  }),
  dependant: () => ({
    firstName: '',
    lastName: '',
    relationship: '',
    gender: '',
    phoneNumber: '',
    dateOfBirth: '',
  }),
};

// Common display formatters
export const formatFullName = (firstName?: string, lastName?: string): string => {
  return `${firstName || ''} ${lastName || ''}`.trim() || '-';
};

export const formatDisplayValue = (value?: string | null, fallback = '-') => {
  return value || fallback;
};

export const formatMemberName = (member: { firstName?: string; lastName?: string }): string => {
  return formatFullName(member.firstName, member.lastName);
};

export const formatMemberDisplay = (member: MemberListItem): string => {
  return `${member.firstName} ${member.lastName} (${member.nationalID})`;
};

export const formatPrincipalDisplay = (principal?: { firstName?: string; lastName?: string; nationalID?: string }): string => {
  if (!principal) return '-';
  return `${principal.firstName} ${principal.lastName} (${principal.nationalID})`;
};
