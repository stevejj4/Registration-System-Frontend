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
    principalFirstName: string | null;
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
          onChange={(value) => onChange({ ...principal, firstName: value })}
          placeholder="Enter first name"
          error={errors.principalFirstName}
        />

        <TextInput
          label="Last Name"
          value={principal.lastName}
          onChange={(value) => onChange({ ...principal, lastName: value })}
          placeholder="Enter last name"
          error={errors.principalLastName}
        />

        <TextInput
          label="National ID"
          value={principal.nationalID}
          onChange={(value) => onChange({ ...principal, nationalID: value })}
          placeholder="Enter national ID number"
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
          onChange={(value) => onChange({ ...principal, phoneNumber: value })}
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
          value={principal.groupName}
          onChange={(value) => onChange({ ...principal, groupName: value })}
          placeholder="Enter group name"
          error={errors.principalGroupName}
        />
      </div>
    </div>
  );
}

