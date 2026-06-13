import React from "react";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import NextOfKinForm from "./NextOfKinForm";
import type { NextOfKin } from "@/types/member";

const emptyNextOfKin: NextOfKin = {
  firstName: "",
  lastName: "",
  relationship: "OTHER",
  gender: "OTHER",
  idNumber: "",
  phoneNumber: "",
  dateOfBirth: "",
};

const emptyErrors = {
  nextOfKinFirstName: null,
  nextOfKinLastName: null,
  nextOfKinRelationship: null,
  nextOfKinGender: null,
  nextOfKinIdNumber: null,
  nextOfKinPhoneNumber: null,
  nextOfKinDateOfBirth: null,
};

describe("NextOfKinForm accessibility", () => {
  it("has no detectable axe violations for labeled inputs and controls", async () => {
    const { container } = render(
      <NextOfKinForm
        nextOfKin={emptyNextOfKin}
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
