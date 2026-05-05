import { MemberDetails, MemberListItem } from "@/types/member";

// Get string value safely from API response
const safeString = (value: any): string => {
  return value?.toString() || '';
};

// Get optional string value safely from API response
const safeOptionalString = (value: any): string | undefined => {
  return value ? value.toString() : undefined;
};

// Convert API response to our MemberDetails format
export function mapMemberDetails(api: any): MemberDetails {
  // Make sure we actually got data from the API
  if (!api || typeof api !== 'object') {
    console.warn('Invalid API response provided to mapMemberDetails:', api);
    api = {};
  }

  // Get the member data - backend might nest it under 'principal' or 'member'
  const memberData = api.principal || api.member || api;
  
  // Backend sometimes returns nextOfKin as array, sometimes as single object
  const nextOfKinData = Array.isArray(api.nextOfKin) ? api.nextOfKin[0] : api.nextOfKin;
  
  const mappedNextOfKin = nextOfKinData
    ? {
        id: safeOptionalString(nextOfKinData?.id),
        firstName: safeString(nextOfKinData?.firstName),
        lastName: safeString(nextOfKinData?.lastName),
        relationship: safeString(nextOfKinData?.relationship),
        idNumber: safeString(nextOfKinData?.idNumber),
        phoneNumber: safeString(nextOfKinData?.phoneNumber),
        dateOfBirth: safeString(nextOfKinData?.dateOfBirth),
      }
    : null;
    
  return {
    id: safeString(memberData?.id || api.id),
    principal: {
      id: safeString(memberData?.id),
      firstName: safeString(memberData?.firstName),
      lastName: safeString(memberData?.lastName),
      nationalID: safeString(memberData?.nationalID),
      phoneNumber: safeString(memberData?.phoneNumber),
      groupName: safeString(memberData?.groupName),
      dateOfBirth: safeString(memberData?.dateOfBirth),
    },
    nextOfKin: mappedNextOfKin,
    dependants: Array.isArray(api.dependants) 
      ? api.dependants.map((d: any) => ({
          id: safeOptionalString(d?.id),
          firstName: safeString(d?.firstName),
          lastName: safeString(d?.lastName),
          relationship: safeString(d?.relationship),
          gender: safeString(d?.gender),
          phoneNumber: safeOptionalString(d?.phoneNumber),
          dateOfBirth: safeString(d?.dateOfBirth),
        }))
      : [],
    registrationDate: safeString(memberData?.createdAt || api.registrationDate) || new Date().toISOString().split('T')[0],
  };
}

/**
 * Maps API response to MemberListItem type
 */
export function mapMemberListItem(api: any): MemberListItem {
  // Defensive: ensure api is an object
  if (!api || typeof api !== 'object') {
    console.warn('Invalid API response provided to mapMemberListItem:', api);
    api = {};
  }

  // Extract member data (could be nested or flat)
  const memberData = api.member || api;

  return {
    id: safeString(memberData?.id || api.id),
    firstName: safeString(memberData?.firstName || api.firstName),
    lastName: safeString(memberData?.lastName || api.lastName),
    nationalID: safeString(memberData?.nationalID || api.nationalID),
    phoneNumber: safeString(memberData?.phoneNumber || api.phoneNumber),
    groupName: safeString(memberData?.groupName || api.groupName),
    registrationDate: safeString(memberData?.createdAt || api.registrationDate) || new Date().toISOString().split('T')[0],
  };
}
