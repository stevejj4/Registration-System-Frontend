import React from "react";
import { Users } from "lucide-react";
import { NextOfKin } from "@/types/member";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import DateInput from "@/components/ui/DateInput";
import { displayTextToGender, genderToDisplayText, displayTextToRelationship, relationshipToDisplayText } from "@/utils/helpers";

interface Props { // Consider renaming to NextOfKinFormProps for clarity
  nextOfKin: NextOfKin;
  onChange: (nextOfKin: NextOfKin) => void;
  errors: {
    nextOfKinFirstName: string | null;
    nextOfKinLastName: string | null;
    nextOfKinRelationship: string | null;
    nextOfKinGender: string | null;
    nextOfKinIdNumber: string | null;
    nextOfKinPhoneNumber: string | null;
    nextOfKinDateOfBirth: string | null;
  };
}

const relationshipOptions = [
  { value: "Spouse", label: "Spouse" },
  { value: "Parent", label: "Parent" },
  { value: "Son", label: "Son" },
  { value: "Daughter", label: "Daughter" },
  { value: "Other", label: "Other" },
];

const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

export default function NextOfKinForm({ nextOfKin, onChange, errors }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-8">
      <div className="flex items-center mb-6">
        <div className="bg-purple-100 p-2 rounded-lg mr-3">
          <Users className="w-6 h-6 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Next of Kin Information</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextInput
          label="First Name"
          value={nextOfKin.firstName}
          onChange={(value) => onChange({ ...nextOfKin, firstName: value })}
          placeholder="Enter first name"
          error={errors.nextOfKinFirstName}
        />

        <TextInput
          label="Last Name"
          value={nextOfKin.lastName}
          onChange={(value) => onChange({ ...nextOfKin, lastName: value })}
          placeholder="Enter last name"
          error={errors.nextOfKinLastName}
        />

        <SelectInput
          label="Relationship"
          value={relationshipToDisplayText(nextOfKin.relationship)}
          onChange={(displayValue) => {
            const relationshipValue = displayTextToRelationship(displayValue);
            onChange({ ...nextOfKin, relationship: relationshipValue });
          }}
          options={relationshipOptions}
          error={errors.nextOfKinRelationship}
        />

        <SelectInput
          label="Gender"
          value={genderToDisplayText(nextOfKin.gender)}
          onChange={(displayValue) => {
            const genderValue = displayTextToGender(displayValue);
            onChange({ ...nextOfKin, gender: genderValue });
          }}
          options={genderOptions}
          error={errors.nextOfKinGender}
        />

        <TextInput
          label="ID Number"
          value={nextOfKin.idNumber}
          onChange={(value) => onChange({ ...nextOfKin, idNumber: value })}
          placeholder="Enter ID number"
          error={errors.nextOfKinIdNumber}
        />

        <TextInput
          label="Phone Number"
          type="tel"
          value={nextOfKin.phoneNumber}
          onChange={(value) => onChange({ ...nextOfKin, phoneNumber: value })}
          placeholder="07XXXXXXXX"
          error={errors.nextOfKinPhoneNumber}
        />

        <DateInput
          label="Date of Birth"
          value={nextOfKin.dateOfBirth}
          onChange={(value) => onChange({ ...nextOfKin, dateOfBirth: value })}
          error={errors.nextOfKinDateOfBirth}
        />

        <TextInput
          label="ID Attachment Path"
          value={nextOfKin.idAttachmentPath || ''}
          onChange={(value) => onChange({ ...nextOfKin, idAttachmentPath: value })}
          placeholder="uploads/ids/filename.png"
        />
        <div className="text-xs text-gray-500 mt-1">Optional: Path to ID attachment file</div>
      </div>
    </div>
  );
}
