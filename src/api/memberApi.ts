import {
  MemberDetails,
  MemberListItem,
  RegisterMemberPayload,
  Dependant,
  NextOfKin,
  SystemUser,
  PrincipalMember,
} from "@/types/member"; // the blueprint for our member data structures
import {
  mapMemberDetails,
  mapMemberListItem,
} from "@/features/members/mappers/memberMapper"; // translators to convert backend data to our frontend types
import { apiClient, handleError } from "./client"; // communication layer with the backend, including error handling logic

/**
 * MEMBER API
 * bridge between our frontend and backend for all member-related operations
 * encapsulates all HTTP requests and responses, providing a clean interface for the rest of the app
 * handles data transformation and error handling in one place for consistency
 * each method calls the apiClient - my axios instance
 * each method handles errors using the handleError function to ensure consistent error messages across the app
 * each method maps raw backend data into frontend types using mapMemberDetails and mapMemberListItem to ensure our UI gets data in the format it expects
 */
export const memberApi = {
  /**
   * Get all members (LIST VIEW)
   * returns a list of members with basic info for display in tables and lists
   * asych -- this method is asynchronous because it involves making an HTTP request to the backend, which can take some time to complete. By using async/await, we can write this code in a more readable and synchronous style while still handling the asynchronous nature of the API call. The method returns a Promise that resolves to an array of MemberListItem objects, which represent the basic information about each member that we want to display in our UI.
   */
  async getAll(): Promise<MemberListItem[]> { // asynch
    try {
      const res = await apiClient.get("/members"); // make a GET request to the /members endpoint of our backend API to retrieve the list of members, this will return a response object that contains the raw data from the backend
      return res.data.map(mapMemberListItem); // map raw backend data to our frontend MemberListItem type using the mapper function, this ensures that the data we get from the backend is transformed into the format our UI expects, and allows us to keep our frontend types decoupled from the backend data structure
    } catch (error) {
      handleError(error, "Failed to fetch members");
    }
  },

  /**
   * Get member by ID
   * returns detailed information about a single member, including their principal info, next of kin, and dependants
   */
  async getById(id: string): Promise<MemberDetails> {
    try {
      const res = await apiClient.get(`/members/${id}`);
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to fetch member details");
    }
  },

  /**
   * Get member by National ID
   */
  async getByNationalId(nationalId: string): Promise<MemberDetails> {
    if (!nationalId) { // validate input before making API call, this helps us catch issues early and provide a better user experience by giving immediate feedback if the national ID is missing or invalid, rather than making an API call that we know will fail -- if the nationalId parameter is falsy (empty string, null, undefined), we throw an error with a message indicating that the National ID is required. This prevents us from making an API call with invalid input and allows us to handle this case gracefully in the UI by showing an appropriate error message to the user. -- I still dont undestand -- this is a form of input validation that helps ensure we have the necessary information to make a successful API call, and provides a better user experience by giving immediate feedback on what went wrong. By throwing an error here, we can catch it in the UI and display a user-friendly message instead of making an API call that we know will fail due to missing input.
      throw new Error("National ID is required");
    }

    try { // make a GET request to the /members/national-id/{nationalId} endpoint of our backend API to retrieve the member details based on their national ID, this will return a response object that contains the raw data from the backend
      const res = await apiClient.get(
        `/members/national-id/${nationalId}` 
      );
      return mapMemberDetails(res.data);
    } catch (error) { // if the API call fails for any reason (network error, server error, validation error, etc.), we catch the error and pass it to our handleError function along with a fallback message "Failed to fetch member details". The handleError function will log the error details for debugging and throw a user-friendly error message that we can display in the UI. This ensures that we have consistent error handling across all our API calls and provides a better user experience when something goes wrong.
      handleError(error, "Failed to fetch member details");
    }
  },

  // Add a new member to the system
  /**
   * Registers a new member in the system
   * @param payload // the data required to create a new member, including their principal information, next of kin, and dependants. The RegisterMemberPayload type defines the structure of this data, ensuring that we provide all the necessary information in the correct format when making the API call. This allows us to create new members in the system by sending the appropriate data to the backend API.
   * @returns // the details of the newly registered member, including their principal info, next of kin, and dependants. The MemberDetails type defines the structure of this data, ensuring that our UI receives all the necessary information in the expected format when a new member is created. This allows us to display the new member's information immediately after registration without needing to make an additional API call to fetch their details.
   * 
   */
  async registerMember(
    payload: RegisterMemberPayload // the data we need to send to the backend to create a new member, this includes the principal member's info, their next of kin, and any dependants they have. The RegisterMemberPayload type defines the structure of this data, ensuring that we provide all the necessary information in the correct format when making the API call.
  ): Promise<MemberDetails> {
    try {
      /**
       * key pair value object that we send to the backend API to create a new member, 
       * this object is structured according to what the backend expects, which may be different from our frontend types. 
       * For example, the backend might want the principal member's info under a "principal" key, the next of kin as a single object (not an array), and the dependants as an array. 
       * By creating this backendPayload object, we can transform our frontend data into the format that the backend API expects, allowing us to successfully create a new member in the system. 
       * This also allows us to keep our frontend types decoupled from the backend data structure, giving us flexibility to evolve our frontend models independently as needed.  
       * 
       */
      const backendPayload = { // the backend expects the data in a specific format, so we create a new object that matches what the backend API expects. This allows us to keep our frontend types decoupled from the backend data structure, giving us flexibility to evolve our frontend models independently as needed. In this case, the backend wants the principal member's info under a "principal" key, the next of kin as a single object (not an array), and the dependants as an array.
        principal: payload.principal, // backend expects the principal member's info under a "principal" key, so we take the principal data from our payload and put it under this key in the backendPayload object
        nextOfKin: payload.nextOfKin, // backend wants this as a single object, not array
        dependants: payload.dependants || [] // || 
      };

      const res = await apiClient.post("/members/register", backendPayload); // backendPayload is the data we send to the backend API to create a new member, this will return a response object that contains the raw data from the backend about the newly created member
      return mapMemberDetails(res.data); // we take the raw response data from the backend and map it to our frontend MemberDetails type using the mapMemberDetails function, this ensures that the data we get from the backend is transformed into the format our UI expects, and allows us to keep our frontend types decoupled from the backend data structure
    } catch (error) {
      handleError(error, "Failed to register member");
      throw error; // let the UI handle the error
    }
  },
  // patch principal member info (partial update) - this is for updating basic member info like name, phone, etc. without affecting next of kin or dependants
  async patchPrincipal(
    id: string, // the ID of the member we want to update, this is used to identify which member's information we want to modify in the backend
    data: Partial<PrincipalMember> // the data we want to update for the principal member, this is a partial type which means we can provide only the fields we want to update (e.g. just the phone number or just the first name), and it will not affect any other fields that are not included in this data object. This allows us to make partial updates to a member's information without needing to send all their data back to the backend.
  ): Promise<MemberDetails> {
    try {
      const res = await apiClient.patch(`/members/${id}`, data); // make a PATCH request to the /members/{id} endpoint of our backend API with the data we want to update, this will return a response object that contains the raw data from the backend about the updated member
      return mapMemberDetails(res.data); // we take the raw response data from the backend and map it to our frontend MemberDetails type using the mapMemberDetails function, this ensures that the data we get from the backend is transformed into the format our UI expects, and allows us to keep our frontend types decoupled from the backend data structure
    } catch (error) {
      handleError(error, "Failed to update member");
      throw error; // let the UI handle the error
    }
  },
  // Update a member's basic info
  async updatePrincipal(
    id: string, // the ID of the member we want to update, this is used to identify which member's information we want to modify in the backend
    data: Partial<PrincipalMember>
  ): Promise<MemberDetails> {
    try {
      const res = await apiClient.patch(`/members/${id}`, data);
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to update member");
      throw error;
    }
  },

  // Next of Kin related methods

  // Update next of kin info (replace all fields)
  async updateNextOfKin(
    principalId: string,
    data: NextOfKin
  ): Promise<MemberDetails> {
    try {
      const res = await apiClient.put(
        `/members/${principalId}/next-of-kin`,
        data
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to update next of kin");
      throw error;
    }
  },

  // Update some next of kin fields (partial update)
  async patchNextOfKin(
    principalId: string,
    data: Partial<NextOfKin>
  ): Promise<MemberDetails> {
    try {
      const res = await apiClient.patch(
        `/members/${principalId}/next-of-kin`,
        data
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      console.error("Next of Kin patch failed:", error.response?.data || error);
      handleError(error, "Failed to patch next of kin");
      throw error;
    }
  },

  /**
   * DEPENDANTS
   * 
   */

  async addDependant(
    principalId: string,
    data: Omit<Dependant, "id"> // "id" is generated by the backend, so we omit it from the data we send when adding a new dependant
  ): Promise<MemberDetails> { // promise that it will return the updated member details after adding the new dependant, this allows us to immediately reflect the changes in the UI without needing to make an additional API call to fetch the updated member details
    try {
      const res = await apiClient.post(
        `/members/${principalId}/dependants`,
        data
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to add dependant");
    }
  },

  async updateDependant( // why dont we search by principalId here? -- because the dependantId is unique and sufficient to identify which dependant we want to update, we don't need the principalId to perform this update. The backend API is designed to allow us to update a dependant directly by their ID, which simplifies the request and reduces the amount of data we need to send. This also allows us to make updates to a dependant without needing to know or include the principal member's ID in the request, making it more flexible and easier to use in different contexts where we might only have the dependant's ID available. | but the business logic says you can only update dependant after accessing the member details through the principalId, so we can ensure that the dependant belongs to the correct principal member before allowing updates. This adds an extra layer of validation and security to prevent unauthorized updates to dependants that do not belong to the specified principal member. By requiring the principalId in the update process, we can enforce this business rule and maintain data integrity in our system.
    dependantId: string, // de
    data: Partial<Dependant>
  ): Promise<void> { // why void -- because after updating a dependant, we don't necessarily need to return the entire updated member details to the UI. The UI can choose to refresh the member details separately if needed. By returning void, we indicate that this method is only responsible for performing the update operation and does not return any data. This can simplify the implementation and reduce unnecessary data transfer if the UI does not require the updated member details immediately after the update operation. However, if we find that we often need the updated member details after updating a dependant, we could consider changing this method to return MemberDetails instead for convenience.
    try {
      await apiClient.patch(
        `/members/dependants/${dependantId}`,
        data
      );
    } catch (error) {
      handleError(error, "Failed to update dependant");
    }
  },

  async deleteDependant(
    principalId: string,
    dependantId: string
  ): Promise<MemberDetails> {
    try {
      const res = await apiClient.delete(
        `/members/${principalId}/dependants/${dependantId}` 
      );
      return mapMemberDetails(res.data);
    } catch (error) {
      handleError(error, "Failed to delete dependant");
    }
  },

  /**
   * AUTH
   */

  async signup(data: Omit<SystemUser, "id">): Promise<SystemUser> {
    try {
      const res = await apiClient.post("/signup", data);
      return res.data;
    } catch (error) {
      handleError(error, "Sign up failed");
    }
  },
};

