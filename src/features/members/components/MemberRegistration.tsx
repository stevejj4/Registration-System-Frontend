import React, { useState } from "react";
import { PrincipalMember, Dependant, NextOfKin, RegisterMemberPayload, DependantDTO } from "@/types/member";
import { Save, ArrowLeft, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import PrincipalMemberForm from "./PrincipalMemberForm";
import NextOfKinForm from "./NextOfKinForm";
import DependantsForm from "./DependantsForm";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import {
  validatePrincipal,
  validateNextOfKin,
  validateDependants,
  initialValidationError,
  ValidationError,
} from "../validation/memberValidation";
import { registerMember } from "../services/registrationService";
import { memberApi } from "@/api/memberApi";

interface Props {
  onSuccess: (memberId: string) => void;
  onCancel: () => void;
}

export default function MemberRegistration({ onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationError>(initialValidationError);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [principal, setPrincipal] = useState<PrincipalMember>({
    firstName: "",
    lastName: "",
    nationalID: "",
    gender: "OTHER",
    phoneNumber: "",
    dateOfBirth: "",
    groupName: "",
  });

  const [nextOfKin, setNextOfKin] = useState<NextOfKin>({
    firstName: "",
    lastName: "",
    relationship: "OTHER",
    gender: "OTHER",
    idNumber: "",
    phoneNumber: "",
    dateOfBirth: "",
  });

  const [dependants, setDependants] = useState<Dependant[]>([]);

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

  const handleSubmit = async () => {
    // Clear existing errors before validation
    setErrors(initialValidationError);

    // Client-side duplicate ID check
    try {
      const existingMembers = await memberApi.getAll();
      const duplicateMember = existingMembers.find(
        (member) => member.nationalID === principal.nationalID
      );

      if (duplicateMember) {
        setErrors((prev) => ({
          ...prev,
          principalNationalID: "A member with this National ID already exists",
        }));
        return;
      }
    } catch (error) {
      // If the check fails, continue with submission (backend will validate)
      console.warn("Failed to check for duplicate ID:", error);
    }

    // Validate all sections using the new validation functions
    let newErrors = validatePrincipal(principal, initialValidationError);
    newErrors = validateNextOfKin(nextOfKin, newErrors);
    newErrors = validateDependants(dependants, newErrors);

    setErrors(newErrors);

    // Check if there are any validation errors
    const hasErrors = Object.values(newErrors).some(error => error !== null);
    if (hasErrors) {
      return;
    }

    // Show confirmation modal instead of submitting directly
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmation(false);
    setLoading(true);
    setErrors(initialValidationError);

    // Convert form data to proper DTO format
    // Filter out temporary string IDs (new dependants shouldn't have IDs)
    const convertedDependants: DependantDTO[] = dependants.map(dep => ({
      firstName: dep.firstName,
      lastName: dep.lastName,
      relationship: dep.relationship as any, // TypeScript knows it's a valid RelationshipType after validation
      gender: dep.gender as any, // TypeScript knows it's a valid GenderType after validation
      phoneNumber: dep.phoneNumber,
      dateOfBirth: dep.dateOfBirth,
      birthCertificatePath: dep.birthCertificatePath,
      // Omit id - new dependants don't have IDs yet
    }));

    const payload: RegisterMemberPayload = {
      principal,
      nextOfKin,
      dependants: convertedDependants,
    };

    const result = await registerMember(payload);
    setLoading(false);

    if (result.success && result.memberId) {
      onSuccess(result.memberId);
    } else {
      setErrors(prev => ({ ...prev, general: result.error || 'Registration failed' }));
    }
  };

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={onCancel}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-2">Register New Member</h1>
          <p className="text-gray-600 text-lg">Fill in the member's information below</p>
        </div>

        <PrincipalMemberForm
          principal={principal}
          onChange={setPrincipal}
          errors={{
            principalFirstName: errors.principalFirstName,
            principalLastName: errors.principalLastName,
            principalNationalID: errors.principalNationalID,
            principalGender: errors.principalGender,
            principalPhoneNumber: errors.principalPhoneNumber,
            principalDateOfBirth: errors.principalDateOfBirth,
            principalGroupName: errors.principalGroupName,
          }}
        />

        <NextOfKinForm
          nextOfKin={nextOfKin}
          onChange={setNextOfKin}
          errors={{
            nextOfKinFirstName: errors.nextOfKinFirstName,
            nextOfKinLastName: errors.nextOfKinLastName,
            nextOfKinRelationship: errors.nextOfKinRelationship,
            nextOfKinGender: errors.nextOfKinGender,
            nextOfKinIdNumber: errors.nextOfKinIdNumber,
            nextOfKinPhoneNumber: errors.nextOfKinPhoneNumber,
            nextOfKinDateOfBirth: errors.nextOfKinDateOfBirth,
          }}
        />

        <DependantsForm
          dependants={dependants}
          onChange={setDependants}
          onAdd={addDependant}
          onRemove={removeDependant}
          errors={{ general: errors.general }}
        />

        {/* General Error */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
            <div className="text-sm text-red-600 font-medium">{errors.general}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md hover:shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Registering...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 mr-2" />
                Register Member
              </>
            )}
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        title="Confirm Registration"
        message={`Are you sure you want to register ${principal.firstName} ${principal.lastName}? This action cannot be undone.`}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirmation(false)}
        confirmText="Register Member"
        cancelText="Cancel"
      />
    </>
  );
}
