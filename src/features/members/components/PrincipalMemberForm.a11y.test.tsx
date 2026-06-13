import React from "react";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import PrincipalMemberForm from "./PrincipalMemberForm";
import type { PrincipalMember } from "@/types/member";

const emptyPrincipal: PrincipalMember = {
  firstName: "",
  lastName: "",
  nationalID: "",
  gender: "OTHER",
  phoneNumber: "",
  dateOfBirth: "",
  groupName: "",
};

const emptyErrors = {
  principalFirstName: null,
  principalLastName: null,
  principalNationalID: null,
  principalGender: null,
  principalPhoneNumber: null,
  principalDateOfBirth: null,
  principalGroupName: null,
};

/**
 * Accessibility template for registration forms.
 * Extend this pattern to NextOfKinForm and DependantsForm suites.
 */
describe("PrincipalMemberForm accessibility", () => {
  it("has no detectable axe violations for labeled inputs and controls", async () => {
    const { container } = render(
      <PrincipalMemberForm
        principal={emptyPrincipal}
        onChange={() => undefined}
        errors={emptyErrors}
      />
    );

    const results = await axe(container, {
      rules: {
        "color-contrast": { enabled: false },
        "button-name": { enabled: true },
        label: { enabled: true },
      },
    });

    expect(results.violations).toHaveLength(0);
  });
});
