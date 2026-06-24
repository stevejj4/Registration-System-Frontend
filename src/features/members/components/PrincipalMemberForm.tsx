import React from "react";
import { User } from "lucide-react";
import { PrincipalMember } from "@/types/member";
import TextInput from "@/components/ui/TextInput";
import DateInput from "@/components/ui/DateInput";
import SelectInput from "@/components/ui/SelectInput";
import { displayTextToGender, genderToDisplayText } from "@/utils/helpers";
import type { CountyDTO, SubCountyDTO, WardDTO } from "@/types/location";
import type { MemberGroupDTO } from "@/types/group";

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
    principalRegistrationType: string | null;
    principalCountyId: string | null;
    principalSubCountyId: string | null;
    principalWardId: string | null;
    principalGroupId: string | null;
  };
  counties?: CountyDTO[];
  subCounties?: SubCountyDTO[];
  wards?: WardDTO[];
  groups?: MemberGroupDTO[];
  locationsLoading?: boolean;
  groupsLoading?: boolean;
  canSelectFullLocation?: boolean;
  assignedCountyName?: string;
  assignedSubCountyName?: string;
}

export default function PrincipalMemberForm({
  principal,
  onChange,
  errors,
  counties = [],
  subCounties = [],
  wards = [],
  groups = [],
  locationsLoading = false,
  groupsLoading = false,
  canSelectFullLocation = true,
  assignedCountyName,
  assignedSubCountyName,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-8">
      <div className="flex items-center mb-6">
        <div className="bg-blue-100 p-2 rounded-lg mr-3">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Principal Member Information</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectInput
          id="principal-registration-type"
          label="Registration Type"
          value={principal.registrationType ?? "INDIVIDUAL"}
          onChange={(value) => {
            const registrationType = value as PrincipalMember["registrationType"];
            onChange({
              ...principal,
              registrationType,
              groupId: registrationType === "GROUP" ? principal.groupId : undefined,
            });
          }}
          options={[
            { value: "INDIVIDUAL", label: "Individual" },
            { value: "GROUP", label: "Group" },
          ]}
          error={errors.principalRegistrationType}
          required
        />

        {canSelectFullLocation ? (
          <>
            <SelectInput
              id="principal-county"
              label="County"
              value={principal.countyId ? String(principal.countyId) : ""}
              onChange={(value) =>
                onChange({
                  ...principal,
                  countyId: value ? Number(value) : undefined,
                  subCountyId: undefined,
                  wardId: undefined,
                  groupId: undefined,
                })
              }
              options={counties.map((county) => ({
                value: String(county.id),
                label: county.name,
              }))}
              error={errors.principalCountyId}
              disabled={locationsLoading}
              required
            />

            <SelectInput
              id="principal-sub-county"
              label="Sub-county"
              value={principal.subCountyId ? String(principal.subCountyId) : ""}
              onChange={(value) =>
                onChange({
                  ...principal,
                  subCountyId: value ? Number(value) : undefined,
                  wardId: undefined,
                  groupId: undefined,
                })
              }
              options={subCounties.map((subCounty) => ({
                value: String(subCounty.id),
                label: subCounty.name,
              }))}
              error={errors.principalSubCountyId}
              disabled={locationsLoading || !principal.countyId}
              required
            />
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                County
              </label>
              <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700">
                {assignedCountyName ?? "Assigned county"}
              </div>
              {errors.principalCountyId && (
                <div role="alert" className="mt-1.5 text-sm text-red-600 font-medium">
                  {errors.principalCountyId}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sub-county
              </label>
              <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700">
                {assignedSubCountyName ?? "Assigned sub-county"}
              </div>
              {errors.principalSubCountyId && (
                <div role="alert" className="mt-1.5 text-sm text-red-600 font-medium">
                  {errors.principalSubCountyId}
                </div>
              )}
            </div>
          </>
        )}

        <SelectInput
          id="principal-ward"
          label="Ward"
          value={principal.wardId ? String(principal.wardId) : ""}
          onChange={(value) =>
            onChange({
              ...principal,
              wardId: value ? Number(value) : undefined,
              groupId: undefined,
            })
          }
          options={wards.map((ward) => ({
            value: String(ward.id),
            label: ward.name,
          }))}
          error={errors.principalWardId}
          disabled={locationsLoading || !principal.subCountyId}
          required
        />

        {principal.registrationType === "GROUP" && (
          <SelectInput
            id="principal-group"
            label="Group"
            value={principal.groupId ? String(principal.groupId) : ""}
            onChange={(value) =>
              onChange({
                ...principal,
                groupId: value ? Number(value) : undefined,
              })
            }
            options={groups.map((group) => ({
              value: String(group.id),
              label: `${group.name} (${group.groupId})`,
            }))}
            error={errors.principalGroupId}
            disabled={groupsLoading || !principal.wardId}
            required
          />
        )}

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

      </div>
    </div>
  );
}
