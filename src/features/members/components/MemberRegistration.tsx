import React, { useState } from "react";
import { memberApi } from "@/api/memberApi";
import { checkBackendConnectivity } from "@/api/client";
import { PrincipalMember, Dependant, NextOfKin, RegisterMemberPayload } from "@/types/member";
import { ERROR_MESSAGES, VALIDATION_RULES } from "@/constants";
import { User, Heart, Users, Plus, X, Save, ArrowLeft, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  onSuccess: (memberId: string) => void;
  onCancel: () => void;
}

export default function MemberRegistration({ onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    principal: string | null;
    nextOfKin: string | null;
    dependants: string | null;
    general: string | null;
  }>({
    principal: null,
    nextOfKin: null,
    dependants: null,
    general: null,
  });

  const [principal, setPrincipal] = useState<PrincipalMember>({
    firstName: "",
    lastName: "",
    nationalID: "",
    phoneNumber: "",
    dateOfBirth: "",
    groupName: "",
  });

  const [nextOfKin, setNextOfKin] = useState<NextOfKin>({
    firstName: "",
    lastName: "",
    relationship: "",
    idNumber: "",
    phoneNumber: "",
    dateOfBirth: "",
  });

  const [dependants, setDependants] = useState<Dependant[]>([]);

  const validatePrincipal = (): boolean => {
    const newErrors = { ...errors };
    let isValid = true;

    if (!principal.firstName.trim()) {
      newErrors.principal = "First name is required";
      isValid = false;
    } else if (principal.firstName.length < VALIDATION_RULES.MIN_NAME_LENGTH) {
      newErrors.principal = `First name must be at least ${VALIDATION_RULES.MIN_NAME_LENGTH} characters`;
      isValid = false;
    } else {
      newErrors.principal = null;
    }

    if (!principal.lastName.trim()) {
      newErrors.principal = "Last name is required";
      isValid = false;
    } else if (principal.lastName.length < VALIDATION_RULES.MIN_NAME_LENGTH) {
      newErrors.principal = `Last name must be at least ${VALIDATION_RULES.MIN_NAME_LENGTH} characters`;
      isValid = false;
    }

    if (!principal.nationalID.trim()) {
      newErrors.principal = "National ID is required";
      isValid = false;
    } else if (!VALIDATION_RULES.NATIONAL_ID_REGEX.test(principal.nationalID)) {
      newErrors.principal = ERROR_MESSAGES.INVALID_ID;
      isValid = false;
    }

    if (!principal.phoneNumber.trim()) {
      newErrors.principal = "Phone number is required";
      isValid = false;
    } else if (!VALIDATION_RULES.PHONE_REGEX.test(principal.phoneNumber)) {
      newErrors.principal = ERROR_MESSAGES.INVALID_PHONE;
      isValid = false;
    }

    if (!principal.dateOfBirth) {
      newErrors.principal = "Date of birth is required";
      isValid = false;
    }

    if (!principal.groupName.trim()) {
      newErrors.principal = "Group name is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateNextOfKin = (): boolean => {
    const newErrors = { ...errors };
    let isValid = true;

    if (!nextOfKin.firstName.trim()) {
      newErrors.nextOfKin = "First name is required";
      isValid = false;
    } else if (nextOfKin.firstName.length < VALIDATION_RULES.MIN_NAME_LENGTH) {
      newErrors.nextOfKin = `First name must be at least ${VALIDATION_RULES.MIN_NAME_LENGTH} characters`;
      isValid = false;
    } else {
      newErrors.nextOfKin = null;
    }

    if (!nextOfKin.lastName.trim()) {
      newErrors.nextOfKin = "Last name is required";
      isValid = false;
    } else if (nextOfKin.lastName.length < VALIDATION_RULES.MIN_NAME_LENGTH) {
      newErrors.nextOfKin = `Last name must be at least ${VALIDATION_RULES.MIN_NAME_LENGTH} characters`;
      isValid = false;
    }

    if (!nextOfKin.relationship.trim()) {
      newErrors.nextOfKin = "Relationship is required";
      isValid = false;
    }

    if (!nextOfKin.idNumber.trim()) {
      newErrors.nextOfKin = "ID number is required";
      isValid = false;
    }

    if (!nextOfKin.phoneNumber.trim()) {
      newErrors.nextOfKin = "Phone number is required";
      isValid = false;
    } else if (!VALIDATION_RULES.PHONE_REGEX.test(nextOfKin.phoneNumber)) {
      newErrors.nextOfKin = ERROR_MESSAGES.INVALID_PHONE;
      isValid = false;
    }

    if (!nextOfKin.dateOfBirth) {
      newErrors.nextOfKin = "Date of birth is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const addDependant = () => {
    const newDependant: Dependant = {
      id: Date.now().toString(),
      firstName: "",
      lastName: "",
      relationship: "",
      gender: "",
      phoneNumber: "",
      dateOfBirth: "",
    };
    setDependants([...dependants, newDependant]);
  };

  const updateDependant = (id: string, field: keyof Dependant, value: string) => {
    setDependants(
      dependants.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const removeDependant = (id: string) => {
    setDependants(dependants.filter((d) => d.id !== id));
  };

  const validateDependants = (): boolean => {
    const newErrors = { ...errors };
    let isValid = true;

    // Only validate dependants if there are any
    if (dependants.length > 0) {
      for (const dependant of dependants) {
        if (!dependant.firstName.trim() || !dependant.lastName.trim()) {
          newErrors.dependants = "All dependants must have first and last names";
          isValid = false;
          break;
        }

        if (!dependant.relationship.trim()) {
          newErrors.dependants = "All dependants must have a relationship";
          isValid = false;
          break;
        }

        if (!dependant.gender.trim()) {
          newErrors.dependants = "All dependants must have a gender";
          isValid = false;
          break;
        }

        if (dependant.phoneNumber && !VALIDATION_RULES.PHONE_REGEX.test(dependant.phoneNumber)) {
          newErrors.dependants = "Invalid phone number format for dependant";
          isValid = false;
          break;
        }
      }
    } else {
      // Clear dependants errors if no dependants
      newErrors.dependants = null;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    const isPrincipalValid = validatePrincipal();
    const isNextOfKinValid = validateNextOfKin();
    const areDependantsValid = validateDependants();

    if (!isPrincipalValid || !isNextOfKinValid || !areDependantsValid) {
      return;
    }

    setLoading(true);
    setErrors({ principal: null, nextOfKin: null, dependants: null, general: null });

    try {
      // Check backend connectivity first
      const isBackendConnected = await checkBackendConnectivity();
      
      if (!isBackendConnected) {
        throw new Error('Server is currently unavailable. Please try again later.');
      }

      const payload: RegisterMemberPayload = {
        principal,
        nextOfKin,
        dependants,
      };

      const newMember = await memberApi.registerMember(payload);
      onSuccess(newMember.id);
      setLoading(false);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setErrors(prev => ({ ...prev, general: err.message || ERROR_MESSAGES.REGISTRATION_FAILED }));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onCancel}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">Register New Member</h1>
        <p className="text-gray-600">Fill in the member's information below</p>
      </div>

      {/* Principal Member Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center mb-4">
          <User className="w-6 h-6 text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Principal Member Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={principal.firstName}
              onChange={(e) => setPrincipal({ ...principal, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter first name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={principal.lastName}
              onChange={(e) => setPrincipal({ ...principal, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter last name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              National ID
            </label>
            <input
              type="text"
              value={principal.nationalID}
              onChange={(e) => setPrincipal({ ...principal, nationalID: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter 8-digit national ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={principal.phoneNumber}
              onChange={(e) => setPrincipal({ ...principal, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="07XXXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={principal.dateOfBirth}
              onChange={(e) => setPrincipal({ ...principal, dateOfBirth: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={principal.groupName}
              onChange={(e) => setPrincipal({ ...principal, groupName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter group name"
            />
          </div>
        </div>

        {errors.principal && (
          <div className="mt-2 text-sm text-red-600">{errors.principal}</div>
        )}
      </div>

      {/* Next of Kin Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center mb-4">
          <Heart className="w-6 h-6 text-red-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Next of Kin Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={nextOfKin.firstName}
              onChange={(e) => setNextOfKin({ ...nextOfKin, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter first name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={nextOfKin.lastName}
              onChange={(e) => setNextOfKin({ ...nextOfKin, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter last name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship
            </label>
            <select
              value={nextOfKin.relationship}
              onChange={(e) => setNextOfKin({ ...nextOfKin, relationship: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select relationship</option>
              <option value="Spouse">Spouse</option>
              <option value="Parent">Parent</option>
              <option value="Sibling">Sibling</option>
              <option value="Child">Child</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Number
            </label>
            <input
              type="text"
              value={nextOfKin.idNumber}
              onChange={(e) => setNextOfKin({ ...nextOfKin, idNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter ID number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={nextOfKin.phoneNumber}
              onChange={(e) => setNextOfKin({ ...nextOfKin, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="07XXXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={nextOfKin.dateOfBirth}
              onChange={(e) => setNextOfKin({ ...nextOfKin, dateOfBirth: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Attachment Path
            </label>
            <input
              type="text"
              value={nextOfKin.idAttachmentPath || ''}
              onChange={(e) => setNextOfKin({ ...nextOfKin, idAttachmentPath: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="uploads/ids/filename.png"
            />
            <p className="text-xs text-gray-500 mt-1">Optional: Path to ID attachment file</p>
          </div>
        </div>

        {errors.nextOfKin && (
          <div className="mt-2 text-sm text-red-600">{errors.nextOfKin}</div>
        )}
      </div>

      {/* Dependants Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Users className="w-6 h-6 text-green-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Dependants</h2>
          </div>
          <button
            type="button"
            onClick={addDependant}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Dependant
          </button>
        </div>

        <AnimatePresence>
          {dependants.map((dependant, index) => (
            <motion.div
              key={dependant.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-gray-200 rounded-lg p-4 mb-4"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium text-gray-900">Dependant {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeDependant(dependant.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={dependant.firstName}
                    onChange={(e) => updateDependant(dependant.id, "firstName", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={dependant.lastName}
                    onChange={(e) => updateDependant(dependant.id, "lastName", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship
                  </label>
                  <select
                    value={dependant.relationship}
                    onChange={(e) => updateDependant(dependant.id, "relationship", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select relationship</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Spouse">Spouse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={dependant.gender}
                    onChange={(e) => updateDependant(dependant.id, "gender", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={dependant.phoneNumber}
                    onChange={(e) => updateDependant(dependant.id, "phoneNumber", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="07XXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dependant.dateOfBirth}
                    onChange={(e) => updateDependant(dependant.id, "dateOfBirth", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Certificate Path (Optional)
                  </label>
                  <input
                    type="text"
                    value={dependant.birthCertificatePath || ''}
                    onChange={(e) => updateDependant(dependant.id, "birthCertificatePath", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="uploads/certs/filename.pdf"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional: Path to birth certificate file</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {dependants.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No dependants added. Click "Add Dependant" to add one.
          </div>
        )}

        {errors.dependants && (
          <div className="mt-2 text-sm text-red-600">{errors.dependants}</div>
        )}
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm text-red-600">{errors.general}</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Registering...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 mr-2" />
              Register Member
            </>
          )}
        </button>
      </div>
    </div>
  );
}
