import React, { useState } from "react";
import { Users, Plus, X } from "lucide-react";
import { Dependant } from "@/types/member";
import { motion, AnimatePresence } from "motion/react";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import DateInput from "@/components/ui/DateInput";

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
  { value: "Sibling", label: "Sibling" },
  { value: "Guardian", label: "Guardian" },
];

const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

export default function DependantsForm({ dependants, onChange, onAdd, onRemove, errors }: Props) {
  const [dependantErrors, setDependantErrors] = useState<Map<string, DependantErrors>>(new Map());

  const validateDependantField = (dependantId: string, field: keyof DependantErrors, value: string) => {
    let error: string | null = null;

    switch (field) {
      case "firstName":
        if (!value.trim()) {
          error = "First name is required";
        }
        break;
      case "lastName":
        if (!value.trim()) {
          error = "Last name is required";
        }
        break;
      case "relationship":
        if (!value.trim()) {
          error = "Relationship is required";
        }
        break;
      case "gender":
        if (!value.trim()) {
          error = "Gender is required";
        }
        break;
      case "dateOfBirth":
        if (!value) {
          error = "Date of birth is required";
        }
        break;
    }

    setDependantErrors((prev) => {
      const currentErrors = prev.get(dependantId) || {
        firstName: null,
        lastName: null,
        relationship: null,
        gender: null,
        dateOfBirth: null,
      };
      const updatedErrors = { ...currentErrors, [field]: error };
      const newMap = new Map(prev);
      newMap.set(dependantId, updatedErrors);
      return newMap;
    });
  };

  const validateDependant = (dependant: Dependant) => {
    validateDependantField(dependant.id, "firstName", dependant.firstName);
    validateDependantField(dependant.id, "lastName", dependant.lastName);
    validateDependantField(dependant.id, "relationship", dependant.relationship);
    validateDependantField(dependant.id, "gender", dependant.gender);
    validateDependantField(dependant.id, "dateOfBirth", dependant.dateOfBirth);
  };

  const hasDependantErrors = (dependantId: string): boolean => {
    const errors = dependantErrors.get(dependantId);
    if (!errors) return false;
    return Object.values(errors).some((error) => error !== null);
  };

  const updateDependant = (id: string, field: keyof Dependant, value: string) => {
    const updatedDependants = dependants.map((d) =>
      d.id === id ? { ...d, [field]: value } : d
    );
    onChange(updatedDependants);

    // Validate the field on change
    const dependant = updatedDependants.find((d) => d.id === id);
    if (dependant) {
      const errorField = field as keyof DependantErrors;
      if (["firstName", "lastName", "relationship", "gender", "dateOfBirth"].includes(errorField)) {
        validateDependantField(id, errorField, value);
      }
    }
  };

  const handleAddDependant = () => {
    // Validate existing dependants before allowing new one
    let hasErrors = false;
    dependants.forEach((dependant) => {
      validateDependant(dependant);
      if (hasDependantErrors(dependant.id)) {
        hasErrors = true;
      }
    });

    if (hasErrors) {
      return;
    }

    onAdd();
  };

  const handleRemoveDependant = (id: string) => {
    onRemove(id);
    // Clear errors for the removed dependant
    setDependantErrors((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  const getDependantErrors = (dependantId: string): DependantErrors => {
    return dependantErrors.get(dependantId) || {
      firstName: null,
      lastName: null,
      relationship: null,
      gender: null,
      dateOfBirth: null,
    };
  };

  const hasAnyDependantErrors = (): boolean => {
    for (const dependant of dependants) {
      if (hasDependantErrors(dependant.id)) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-green-100 p-2 rounded-lg mr-3">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Dependants</h2>
        </div>
        <button
          type="button"
          onClick={handleAddDependant}
          className="flex items-center px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          disabled={hasAnyDependantErrors()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Dependant
        </button>
      </div>

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
            >
              <div className="flex justify-between items-start mb-5">
                <h3 className="font-semibold text-gray-900 text-lg">Dependant {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => handleRemoveDependant(dependant.id)}
                  className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-lg hover:bg-red-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextInput
                  label="First Name"
                  value={dependant.firstName}
                  onChange={(value) => updateDependant(dependant.id, "firstName", value)}
                  placeholder="Enter first name"
                  error={dependantError.firstName}
                />

                <TextInput
                  label="Last Name"
                  value={dependant.lastName}
                  onChange={(value) => updateDependant(dependant.id, "lastName", value)}
                  placeholder="Enter last name"
                  error={dependantError.lastName}
                />

                <SelectInput
                  label="Relationship"
                  value={dependant.relationship}
                  onChange={(value) => updateDependant(dependant.id, "relationship", value)}
                  options={relationshipOptions}
                  error={dependantError.relationship}
                />

                <SelectInput
                  label="Gender"
                  value={dependant.gender}
                  onChange={(value) => updateDependant(dependant.id, "gender", value)}
                  options={genderOptions}
                  error={dependantError.gender}
                />

                <TextInput
                  label="Phone Number"
                  type="tel"
                  value={dependant.phoneNumber || ''}
                  onChange={(value) => updateDependant(dependant.id, "phoneNumber", value)}
                  placeholder="07XXXXXXXX"
                />

                <DateInput
                  label="Date of Birth"
                  value={dependant.dateOfBirth}
                  onChange={(value) => updateDependant(dependant.id, "dateOfBirth", value)}
                  error={dependantError.dateOfBirth}
                />

                <TextInput
                  label="Birth Certificate Path"
                  value={dependant.birthCertificatePath || ''}
                  onChange={(value) => updateDependant(dependant.id, "birthCertificatePath", value)}
                  placeholder="uploads/birth-certificates/filename.png"
                />
                <div className="text-xs text-gray-500 mt-1">Optional: Path to birth certificate file</div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {dependants.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="font-medium">No dependants added</p>
          <p className="text-sm">Click "Add Dependant" to add one</p>
        </div>
      )}
    </div>
  );
}
