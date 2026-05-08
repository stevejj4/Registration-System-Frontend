/*
  * This file contains mapping functions that convert raw API responses into the structured types we use in our frontend application.
  * These functions act as translators between the backend data format and our frontend data models, ensuring that our UI components receive data in the expected format.
  * By centralizing this logic in one place, we can easily manage changes to the API response structure without having to update multiple components across the app.
  * Each function includes defensive checks to handle cases where the API response might be missing fields or have unexpected formats, providing default values to prevent runtime errors in the UI.
  * This approach also allows us to decouple our frontend types from the backend data structure, giving us flexibility to evolve our frontend models independently as needed.
  */

import { MemberDetails, MemberListItem } from "@/types/member"; 

// Get string value safely from API response
// This function takes any value and attempts to convert it to a string. If the value is null or undefined, it returns an empty string instead. This helps prevent issues with missing or malformed data from the API, ensuring that our UI always has a valid string to work with.
const safeString = (value: any): string => { // value -- the input value we want to convert to a string, it can be of any type (string, number, boolean, null, undefined, etc.)
  return value?.toString() || ''; // 
};

// Get optional string value safely from API response
const safeOptionalString = (value: any): string | undefined => { // unde
  return value ? value.toString() : undefined;
};

// Convert API response to our MemberDetails format
export function mapMemberDetails(api: any): MemberDetails { // api and any 
  // Make sure we actually got data from the API
  if (!api || typeof api !== 'object') {
    console.warn('Invalid API response provided to mapMemberDetails:', api); // -- this will log a warning in the browser console if the API response is not an object, which helps us identify issues with the data we're receiving from the backend, especially during development and debugging
    api = {};
  }

  // Get the member data - backend might nest it under 'principal' or 'member'
  const memberData = api.principal || api.member || api; // api.me
  
  // Backend sometimes returns nextOfKin as array, sometimes as single object
  const nextOfKinData = Array.isArray(api.nextOfKin) ? api.nextOfKin[0] : api.nextOfKin;
  
  const mappedNextOfKin = nextOfKinData // 
    ? { 
        id: safeOptionalString(nextOfKinData?.id), // nextOfKin ID is optional, so we use safeOptionalString to allow it to be undefined if not present
        firstName: safeString(nextOfKinData?.firstName), // nextOfKin first name, using safeString to ensure we get a string value even if the API response is missing this field
        lastName: safeString(nextOfKinData?.lastName), // nextOfKin last name, also using safeString for the same reason
        relationship: safeString(nextOfKinData?.relationship), // nextOfKin relationship, using safeString to handle missing data
        idNumber: safeString(nextOfKinData?.idNumber), // nextOfKin ID number, using safeString to ensure we get a string value
        phoneNumber: safeString(nextOfKinData?.phoneNumber), // nextOfKin phone number, using safeString to handle cases where this might be missing from the API response
        dateOfBirth: safeString(nextOfKinData?.dateOfBirth), // nextOfKin date of birth, using safeString to ensure we get a string value even if the API response is missing this field
      }
    : null; // if nextOfKinData is falsy (null, undefined, empty), we set mappedNextOfKin to null, which matches our MemberDetails type where nextOfKin can be null if not provided by the API
    
  return {
    id: safeString(memberData?.id || api.id), //
    principal: {
      id: safeString(memberData?.id),
      firstName: safeString(memberData?.firstName),
      lastName: safeString(memberData?.lastName),
      nationalID: safeString(memberData?.nationalID),
      phoneNumber: safeString(memberData?.phoneNumber),
      groupName: safeString(memberData?.groupName),
      dateOfBirth: safeString(memberData?.dateOfBirth),
    },
    nextOfKin: mappedNextOfKin, // 
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
export function mapMemberListItem(api: any): MemberListItem { // 
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
