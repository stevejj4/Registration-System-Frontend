import React from "react";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import DependantsForm from "./DependantsForm";

const emptyErrors = {
  general: null,
};

describe("DependantsForm accessibility", () => {
  it("has no detectable axe violations for labeled inputs and controls", async () => {
    const { container } = render(
      <DependantsForm
        dependants={[]}
        onChange={() => undefined}
        onAdd={() => undefined}
        onRemove={() => undefined}
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
