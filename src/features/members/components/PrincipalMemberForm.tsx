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
          id="principal-first-name"
          label="First Name"
          value={principal.firstName}
          onChange={(e) => onChange({ ...principal, firstName: e.target.value })}
          placeholder="Enter first name"
          error={errors.principalFirstName}
          required
        />

        <TextInput
          id="principal-last-name"
          label="Last Name"
          value={principal.lastName}
          onChange={(e) => onChange({ ...principal, lastName: e.target.value })}
          placeholder="Enter last name"
          error={errors.principalLastName}
          required
        />

        <TextInput
          id="principal-national-id"
          label="National ID"
          value={principal.nationalID}
          onChange={(e) => onChange({ ...principal, nationalID: e.target.value })}
          placeholder="Enter national ID (6–10 digits)"
          error={errors.principalNationalID}
          required
        />

        <SelectInput
          id="principal-gender"
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
          required
        />

        <TextInput
          id="principal-phone-number"
          label="Phone Number"
          type="tel"
          value={principal.phoneNumber}
          onChange={(e) => onChange({ ...principal, phoneNumber: e.target.value })}
          placeholder="07XXXXXXXX"
          error={errors.principalPhoneNumber}
          required
        />

        <DateInput
          id="principal-date-of-birth"
          label="Date of Birth"
          value={principal.dateOfBirth}
          onChange={(value) => onChange({ ...principal, dateOfBirth: value })}
          error={errors.principalDateOfBirth}
          required
        />

        <TextInput
          id="principal-group-name"
          label="Group Name"
          value={principal.groupName ?? ""}
          onChange={(e) => onChange({ ...principal, groupName: e.target.value })}
          placeholder="Enter group name"
          error={errors.principalGroupName}
          required
        />
      </div>
    </div>
  );
}
