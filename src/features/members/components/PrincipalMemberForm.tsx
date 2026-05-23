import React from "react";
import { User } from "lucide-react";
import { PrincipalMember } from "@/types/member";
import TextInput from "@/components/ui/TextInput";
import DateInput from "@/components/ui/DateInput";
import SelectInput from "@/components/ui/SelectInput";
import { displayTextToGender, genderToDisplayText } from "@/utils/helpers";

interface Props {
  principal: PrincipalMember;
  onChange: (principal: PrincipalMember) => void;
  errors: {
    principalFirstName: string | null; // 
    principalLastName: string | null;
    principalNationalID: string | null;
    principalGender: string | null;
    principalPhoneNumber: string | null;
    principalDateOfBirth: string | null;
    principalGroupName: string | null;
  };
}

export default function PrincipalMemberForm({ principal, onChange, errors }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-8">
      <div className="flex items-center mb-6">
        <div className="bg-blue-100 p-2 rounded-lg mr-3">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Principal Member Information</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextInput
          label="First Name"
          value={principal.firstName}
          onChange={(e) => onChange({ ...principal, firstName: e.target.value })}
          placeholder="Enter first name"
          error={errors.principalFirstName}
        />

        <TextInput
          label="Last Name"
          value={principal.lastName}
          onChange={(e) => onChange({ ...principal, lastName: e.target.value })}
          placeholder="Enter last name"
          error={errors.principalLastName}
        />

        <TextInput
          label="National ID"
          value={principal.nationalID}
          onChange={(e) => onChange({ ...principal, nationalID: e.target.value })}
          placeholder="Enter national ID (6–10 digits)"
          error={errors.principalNationalID}
        />

        <SelectInput
          label="Gender"
          value={genderToDisplayText(principal.gender)}
          onChange={(displayValue) => {
            const genderValue = displayTextToGender(displayValue);
            onChange({ ...principal, gender: genderValue });
          }}
          options={[
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" },
            { value: "Other", label: "Other" },
          ]}
          error={errors.principalGender}
        />

        <TextInput
          label="Phone Number"
          type="tel"
          value={principal.phoneNumber}
          onChange={(e) => onChange({ ...principal, phoneNumber: e.target.value })}
          placeholder="07XXXXXXXX"
          error={errors.principalPhoneNumber}
        />

        <DateInput
          label="Date of Birth"
          value={principal.dateOfBirth}
          onChange={(value) => onChange({ ...principal, dateOfBirth: value })}
          error={errors.principalDateOfBirth}
        />

        <TextInput
          label="Group Name"
          value={principal.groupName ?? ""}
          onChange={(e) => onChange({ ...principal, groupName: e.target.value })}
          placeholder="Enter group name"
          error={errors.principalGroupName}
        />
      </div>
    </div>
  );
}

