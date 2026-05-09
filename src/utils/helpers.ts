/**
 * Utility functions for the Member application
 */

import { MemberListItem } from '@/types/member';

/**
 * Format a date string to a more readable format
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Format a phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return 'N/A';
  
  // Basic formatting for Kenyan phone numbers
  if (phone.startsWith('07') && phone.length === 10) {
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  }
  
  return phone;
};

/**
 * Validate Kenyan national ID format
 */
export const validateNationalId = (id: string): boolean => {
  // Basic validation - should be 8 digits
  return /^\d{8}$/.test(id);
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (phone: string): boolean => {
  // Basic validation for Kenyan phone numbers
  return /^07\d{8}$/.test(phone);
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  
  try {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch {
    return 0;
  }
};

/**
 * Format member full name from first and last name
 */
export const formatMemberName = (member: { firstName?: string; lastName?: string }): string => {
  return `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'N/A';
};

/**
 * Format member display name with national ID
 */
export const formatMemberDisplay = (member: MemberListItem): string => {
  return `${member.firstName} ${member.lastName} (${member.nationalID})`;
};

/**
 * Sort members by name using normalized structure
 */
export const sortMembersByName = (members: MemberListItem[]): MemberListItem[] => {
  return [...members].sort((a, b) => 
    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`) || 0
  );
};

/**
 * Filter members by search term using normalized structure
 */
export const filterMembers = (members: MemberListItem[], searchTerm: string): MemberListItem[] => {
  if (!searchTerm.trim()) return members;
  
  const term = searchTerm.toLowerCase();
  return members.filter(member => 
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(term) ||
    member.nationalID?.toLowerCase().includes(term) ||
    member.phoneNumber?.toLowerCase().includes(term) ||
    member.groupName?.toLowerCase().includes(term)
  );
};
