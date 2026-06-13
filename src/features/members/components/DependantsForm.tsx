import React, { useState } from "react";
import { Users, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Dependant } from "@/types/member";

import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import DateInput from "@/components/ui/DateInput";
import {
  displayTextToGender,
  genderToDisplayText,
  displayTextToRelationship,
  relationshipToDisplayText,
} from "@/utils/helpers";

interface Props {
  dependants: Dependant[];
  onChange: (dependants: Dependant[]) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  errors: {
    general: string | null;
  };
}

interface DependantErrors {
  firstName: string | null;
  lastName: string | null;
  relationship: string | null;
  gender: string | null;
  dateOfBirth: string | null;
}

const relationshipOptions = [
  { value: "Son", label: "Son" },
  { value: "Daughter", label: "Daughter" },
  { value: "Spouse", label: "Spouse" },
  { value: "Parent", label: "Parent" },
  { value: "Other", label: "Other" },
];

const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const defaultErrors: DependantErrors = {
  firstName: null,
  lastName: null,
  relationship: null,
  gender: null,
  dateOfBirth: null,
};

const liveRegionStyle: React.CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export default function DependantsForm({
  dependants,
  onChange,
  onAdd,
  onRemove,
  errors,
}: Props) {
  const [dependantErrors, setDependantErrors] = useState<
    Map<string, DependantErrors>
  >(new Map());
  const [liveMessage, setLiveMessage] = useState("");

  const validateDependantField = (
    dependantId: string,
    field: keyof DependantErrors,
    value?: string
  ) => {
    let error: string | null = null;

    switch (field) {
      case "firstName":
        if (!value?.trim()) {
          error = "First name is required";
        }
        break;

      case "lastName":
        if (!value?.trim()) {
          error = "Last name is required";
        }
        break;

      case "relationship":
        if (!value?.trim()) {
          error = "Relationship is required";
        }
        break;

      case "gender":
        if (!value?.trim()) {
          error = "Gender is required";
        }
        break;

      case "dateOfBirth":
        if (!value) {
          error = "Date of birth is required";
        }
        break;

      default:
        break;
    }

    setDependantErrors((prev) => {
      const currentErrors = prev.get(dependantId) || defaultErrors;

      const updatedErrors = {
        ...currentErrors,
        [field]: error,
      };

      const newMap = new Map(prev);

      newMap.set(dependantId, updatedErrors);

      return newMap;
    });

    return error;
  };

  const validateDependant = (dependant: Dependant): boolean => {
    const firstNameError = validateDependantField(
      dependant.id,
      "firstName",
      dependant.firstName
    );

    const lastNameError = validateDependantField(
      dependant.id,
      "lastName",
      dependant.lastName
    );

    const relationshipError = validateDependantField(
      dependant.id,
      "relationship",
      dependant.relationship
    );

    const genderError = validateDependantField(
      dependant.id,
      "gender",
      dependant.gender
    );

    const dobError = validateDependantField(
      dependant.id,
      "dateOfBirth",
      dependant.dateOfBirth
    );

    return !!(
      firstNameError ||
      lastNameError ||
      relationshipError ||
      genderError ||
      dobError
    );
  };

  const hasDependantErrors = (dependantId: string): boolean => {
    const rowErrors = dependantErrors.get(dependantId);

    if (!rowErrors) return false;

    return Object.values(rowErrors).some((error) => error !== null);
  };

  const hasAnyDependantErrors = (): boolean => {
    for (const dependant of dependants) {
      if (hasDependantErrors(dependant.id)) {
        return true;
      }
    }

    return false;
  };

  const updateDependant = (
    id: string,
    field: keyof Dependant,
    value: string
  ) => {
    const updatedDependants = dependants.map((dependant) =>
      dependant.id === id
        ? {
            ...dependant,
            [field]: value,
          }
        : dependant
    );

    onChange(updatedDependants);

    if (
      field === "firstName" ||
      field === "lastName" ||
      field === "relationship" ||
      field === "gender" ||
      field === "dateOfBirth"
    ) {
      validateDependantField(
        id,
        field as keyof DependantErrors,
        value
      );
    }
  };

  const handleAddDependant = () => {
    let hasErrors = false;

    dependants.forEach((dependant) => {
      const invalid = validateDependant(dependant);

      if (invalid) {
        hasErrors = true;
      }
    });

    if (hasErrors) return;

    onAdd();
    setLiveMessage(`Dependant added`);
  };

  const handleRemoveDependant = (id: string) => {
    const rowNumber = dependants.findIndex((dependant) => dependant.id === id) + 1;

    onRemove(id);

    setDependantErrors((prev) => {
      const newMap = new Map(prev);

      newMap.delete(id);

      return newMap;
    });

    if (rowNumber > 0) {
      setLiveMessage(`Dependant row ${rowNumber} removed`);
    }
  };

  const getDependantErrors = (
    dependantId: string
  ): DependantErrors => {
    return dependantErrors.get(dependantId) || defaultErrors;
  };

  const fieldId = (dependantId: string, field: string) =>
    `dependant-${dependantId}-${field}`;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-8">
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={liveRegionStyle}
      >
        {liveMessage}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-green-100 p-2 rounded-lg mr-3">
            <Users className="w-6 h-6 text-green-600" />
          </div>

          <h2 className="text-xl font-bold text-gray-900">
            Dependants
          </h2>
        </div>

        <button
          type="button"
          onClick={handleAddDependant}
          aria-label="Add dependant"
          className="flex items-center px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          disabled={hasAnyDependantErrors()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Dependant
        </button>
      </div>

      {errors.general && (
        <div
          id="dependants-general-error"
          role="alert"
          className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm"
        >
          {errors.general}
        </div>
      )}

      <AnimatePresence>
        {dependants.map((dependant, index) => {
          const dependantError = getDependantErrors(dependant.id);

          return (
            <motion.div
              key={dependant.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-gray-200 rounded-xl p-6 mb-4 shadow-sm"
              aria-labelledby={`dependant-${dependant.id}-heading`}
            >
              <div className="flex justify-between items-start mb-5">
                <h3
                  id={`dependant-${dependant.id}-heading`}
                  className="font-semibold text-gray-900 text-lg"
                >
                  Dependant {index + 1}
                </h3>

                <button
                  type="button"
                  onClick={() => handleRemoveDependant(dependant.id)}
                  aria-label={`Remove dependant row ${index + 1}`}
                  className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-lg hover:bg-red-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextInput
                  id={fieldId(dependant.id, "first-name")}
                  label="First Name"
                  value={dependant.firstName || ""}
                  onChange={(e) =>
                    updateDependant(
                      dependant.id,
                      "firstName",
                      e.target.value
                    )
                  }
                  placeholder="Enter first name"
                  error={dependantError.firstName}
                  required
                />

                <TextInput
                  id={fieldId(dependant.id, "last-name")}
                  label="Last Name"
                  value={dependant.lastName || ""}
                  onChange={(e) =>
                    updateDependant(
                      dependant.id,
                      "lastName",
                      e.target.value
                    )
                  }
                  placeholder="Enter last name"
                  error={dependantError.lastName}
                  required
                />

                <SelectInput
                  id={fieldId(dependant.id, "relationship")}
                  label="Relationship"
                  value={relationshipToDisplayText(dependant.relationship || "")}
                  onChange={(displayValue) => {
                    const relationshipValue = displayTextToRelationship(displayValue);
                    updateDependant(
                      dependant.id,
                      "relationship",
                      relationshipValue
                    );
                  }}
                  options={relationshipOptions}
                  error={dependantError.relationship}
                  required
                />

                <SelectInput
                  id={fieldId(dependant.id, "gender")}
                  label="Gender"
                  value={genderToDisplayText(dependant.gender || "")}
                  onChange={(displayValue) => {
                    const genderValue = displayTextToGender(displayValue);
                    updateDependant(
                      dependant.id,
                      "gender",
                      genderValue
                    );
                  }}
                  options={genderOptions}
                  error={dependantError.gender}
                  required
                />

                <TextInput
                  id={fieldId(dependant.id, "phone-number")}
                  label="Phone Number"
                  type="tel"
                  value={dependant.phoneNumber || ""}
                  onChange={(e) =>
                    updateDependant(
                      dependant.id,
                      "phoneNumber",
                      e.target.value
                    )
                  }
                  placeholder="07XXXXXXXX"
                />

                <DateInput
                  id={fieldId(dependant.id, "date-of-birth")}
                  label="Date of Birth"
                  value={dependant.dateOfBirth || ""}
                  onChange={(value) =>
                    updateDependant(
                      dependant.id,
                      "dateOfBirth",
                      value
                    )
                  }
                  error={dependantError.dateOfBirth}
                  required
                />

                <div className="md:col-span-2">
                  <TextInput
                    id={fieldId(dependant.id, "birth-certificate-path")}
                    label="Birth Certificate Path"
                    value={
                      typeof dependant.birthCertificatePath === "string"
                        ? dependant.birthCertificatePath
                        : ""
                    }
                    onChange={(e) =>
                      updateDependant(
                        dependant.id,
                        "birthCertificatePath",
                        e.target.value
                      )
                    }
                    placeholder="uploads/birth-certificates/file.png"
                    aria-describedby={fieldId(dependant.id, "birth-cert-hint")}
                  />

                  <div
                    id={fieldId(dependant.id, "birth-cert-hint")}
                    className="text-xs text-gray-500 mt-1"
                  >
                    Optional: Path to birth certificate file
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {dependants.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />

          <p className="font-medium">
            No dependants added
          </p>

          <p className="text-sm">
            Click "Add Dependant" to add one
          </p>
        </div>
      )}
    </div>
  );
}
