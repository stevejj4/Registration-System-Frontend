import React, {
  Suspense,
  lazy,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  PrincipalMember,
  Dependant,
  NextOfKin,
  RegisterMemberPayload,
  DependantDTO,
} from "@/types/member";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import {
  validatePrincipal,
  validateNextOfKin,
  validateDependants,
  initialValidationError,
  ValidationError,
} from "../validation/memberValidation";
import { registerMember } from "../services/registrationService";
import { memberApi } from "@/api/memberApi";
import { locationApi } from "@/api/locationApi";
import { groupApi } from "@/api/groupApi";
import { assignmentApi } from "@/api/assignmentApi";
import { useAuth } from "@/hooks/useAuth";
import type { ApiFieldErrors } from "@/api/client";
import type { AssignmentDTO } from "@/types/auth";
import type { CountyDTO, SubCountyDTO, WardDTO } from "@/types/location";
import type { MemberGroupDTO } from "@/types/group";

const PrincipalMemberForm = lazy(() => import("./PrincipalMemberForm"));
const NextOfKinForm = lazy(() => import("./NextOfKinForm"));
const DependantsForm = lazy(() => import("./DependantsForm"));

function FormSpinner() {
  return (
    <div className="flex justify-center py-8 mb-8">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
    </div>
  );
}

interface ErrorSummaryItem {
  key: string;
  fieldId: string;
  linkText: string;
  revealNok?: boolean;
  revealDependants?: boolean;
}

const FIELD_TARGETS: Record<
  Exclude<keyof ValidationError, "general">,
  { fieldId: string; label: string; revealNok?: boolean; revealDependants?: boolean }
> = {
  principalFirstName: { fieldId: "principal-first-name", label: "Principal first name" },
  principalLastName: { fieldId: "principal-last-name", label: "Principal last name" },
  principalNationalID: { fieldId: "principal-national-id", label: "Principal national ID" },
  principalGender: { fieldId: "principal-gender", label: "Principal gender" },
  principalPhoneNumber: { fieldId: "principal-phone-number", label: "Principal phone number" },
  principalDateOfBirth: { fieldId: "principal-date-of-birth", label: "Principal date of birth" },
  principalGroupName: { fieldId: "principal-group-name", label: "Principal group name" },
  principalRegistrationType: { fieldId: "principal-registration-type", label: "Registration type" },
  principalCountyId: { fieldId: "principal-county", label: "County" },
  principalSubCountyId: { fieldId: "principal-sub-county", label: "Sub-county" },
  principalWardId: { fieldId: "principal-ward", label: "Ward" },
  principalGroupId: { fieldId: "principal-group", label: "Group" },
  nextOfKinFirstName: {
    fieldId: "nok-first-name",
    label: "Next of kin first name",
    revealNok: true,
  },
  nextOfKinLastName: {
    fieldId: "nok-last-name",
    label: "Next of kin last name",
    revealNok: true,
  },
  nextOfKinRelationship: {
    fieldId: "nok-relationship",
    label: "Next of kin relationship",
    revealNok: true,
  },
  nextOfKinGender: {
    fieldId: "nok-gender",
    label: "Next of kin gender",
    revealNok: true,
  },
  nextOfKinIdNumber: {
    fieldId: "nok-id-number",
    label: "Next of kin ID number",
    revealNok: true,
  },
  nextOfKinPhoneNumber: {
    fieldId: "nok-phone-number",
    label: "Next of kin phone number",
    revealNok: true,
  },
  nextOfKinDateOfBirth: {
    fieldId: "nok-date-of-birth",
    label: "Next of kin date of birth",
    revealNok: true,
  },
};

function buildErrorSummaryItems(
  validationErrors: ValidationError,
  dependants: Dependant[]
): ErrorSummaryItem[] {
  const items: ErrorSummaryItem[] = [];

  (Object.keys(FIELD_TARGETS) as Array<keyof typeof FIELD_TARGETS>).forEach((key) => {
    const message = validationErrors[key];
    if (!message) return;

    const target = FIELD_TARGETS[key];
    items.push({
      key,
      fieldId: target.fieldId,
      linkText: `${target.label}: ${message}`,
      revealNok: target.revealNok,
      revealDependants: target.revealDependants,
    });
  });

  if (validationErrors.general) {
    const firstDependant = dependants[0];
    items.push({
      key: "general",
      fieldId: firstDependant
        ? `dependant-${firstDependant.id}-first-name`
        : "dependants-general-error",
      linkText: `Dependants: ${validationErrors.general}`,
      revealDependants: true,
    });
  }

  return items;
}

const API_FIELD_TO_VALIDATION_KEY: Record<string, keyof ValidationError> = {
  "principal.firstName": "principalFirstName",
  firstName: "principalFirstName",
  "principal.lastName": "principalLastName",
  lastName: "principalLastName",
  "principal.nationalID": "principalNationalID",
  "principal.nationalId": "principalNationalID",
  nationalID: "principalNationalID",
  nationalId: "principalNationalID",
  "principal.gender": "principalGender",
  gender: "principalGender",
  "principal.phoneNumber": "principalPhoneNumber",
  phoneNumber: "principalPhoneNumber",
  "principal.dateOfBirth": "principalDateOfBirth",
  dateOfBirth: "principalDateOfBirth",
  "principal.registrationType": "principalRegistrationType",
  registrationType: "principalRegistrationType",
  "principal.countyId": "principalCountyId",
  countyId: "principalCountyId",
  "principal.subCountyId": "principalSubCountyId",
  subCountyId: "principalSubCountyId",
  "principal.wardId": "principalWardId",
  wardId: "principalWardId",
  "principal.groupId": "principalGroupId",
  groupId: "principalGroupId",
  "nextOfKin.firstName": "nextOfKinFirstName",
  "nextOfKin.lastName": "nextOfKinLastName",
  "nextOfKin.relationship": "nextOfKinRelationship",
  "nextOfKin.gender": "nextOfKinGender",
  "nextOfKin.idNumber": "nextOfKinIdNumber",
  "nextOfKin.phoneNumber": "nextOfKinPhoneNumber",
  "nextOfKin.dateOfBirth": "nextOfKinDateOfBirth",
};

function mapApiFieldErrors(fieldErrors?: ApiFieldErrors): Partial<ValidationError> {
  if (!fieldErrors) return {};

  return Object.entries(fieldErrors).reduce<Partial<ValidationError>>(
    (acc, [field, message]) => {
      const key = API_FIELD_TO_VALIDATION_KEY[field];
      if (key) {
        acc[key] = message;
      } else {
        acc.general = message;
      }
      return acc;
    },
    {}
  );
}

interface Props {
  onSuccess: (memberId: string) => void;
  onCancel: () => void;
}

export default function MemberRegistration({ onSuccess, onCancel }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingPrincipal, setCheckingPrincipal] = useState(false);
  const [errors, setErrors] = useState<ValidationError>(initialValidationError);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showNextOfKin, setShowNextOfKin] = useState(false);
  const [showDependants, setShowDependants] = useState(false);
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [counties, setCounties] = useState<CountyDTO[]>([]);
  const [subCounties, setSubCounties] = useState<SubCountyDTO[]>([]);
  const [wards, setWards] = useState<WardDTO[]>([]);
  const [groups, setGroups] = useState<MemberGroupDTO[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [assignment, setAssignment] = useState<AssignmentDTO | null>(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const effectiveRole = assignment?.role ?? user?.role;
  const canSelectFullLocation = effectiveRole === "ADMIN";

  const [principal, setPrincipal] = useState<PrincipalMember>({
    registrationType: "INDIVIDUAL",
    firstName: "",
    lastName: "",
    nationalID: "",
    gender: "OTHER",
    phoneNumber: "",
    dateOfBirth: "",
    groupName: "",
  });

  const [nextOfKin, setNextOfKin] = useState<NextOfKin>({
    firstName: "",
    lastName: "",
    relationship: "OTHER",
    gender: "OTHER",
    idNumber: "",
    phoneNumber: "",
    dateOfBirth: "",
  });

  const [dependants, setDependants] = useState<Dependant[]>([]);

  const errorSummaryItems = useMemo(
    () => buildErrorSummaryItems(errors, dependants),
    [errors, dependants]
  );

  const visibleWards = wards;

  useEffect(() => {
    let active = true;
    setAssignmentLoading(true);
    assignmentApi
      .getMyAssignment()
      .then((data) => {
        if (active) setAssignment(data);
      })
      .catch((error) => {
        console.warn("Failed to load assignment:", error);
        if (active) {
          setErrors((prev) => ({
            ...prev,
            principalCountyId: "Failed to load your assigned location",
          }));
        }
      })
      .finally(() => {
        if (active) setAssignmentLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (canSelectFullLocation || !assignment) return;

    setPrincipal((prev) => ({
      ...prev,
      countyId: assignment.countyId,
      subCountyId: assignment.subCountyId,
      wardId:
        assignment.wardIds.length === 1
          ? assignment.wardIds[0]
          : prev.wardId,
      groupId: undefined,
    }));
  }, [
    assignment,
    canSelectFullLocation,
  ]);

  useEffect(() => {
    if (!canSelectFullLocation) return;

    let active = true;
    setLocationsLoading(true);
    locationApi
      .getCounties()
      .then((items) => {
        if (active) setCounties(items);
      })
      .catch((error) => {
        console.warn("Failed to load counties:", error);
        if (active) {
          setErrors((prev) => ({
            ...prev,
            principalCountyId: "Failed to load counties",
          }));
        }
      })
      .finally(() => {
        if (active) setLocationsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canSelectFullLocation]);

  useEffect(() => {
    if (!canSelectFullLocation || !principal.countyId) {
      setSubCounties([]);
      return;
    }

    let active = true;
    setLocationsLoading(true);
    locationApi
      .getSubCounties(principal.countyId)
      .then((items) => {
        if (active) setSubCounties(items);
      })
      .catch((error) => {
        console.warn("Failed to load sub-counties:", error);
        if (active) {
          setErrors((prev) => ({
            ...prev,
            principalSubCountyId: "Failed to load sub-counties",
          }));
        }
      })
      .finally(() => {
        if (active) setLocationsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canSelectFullLocation, principal.countyId]);

  useEffect(() => {
    if (!principal.subCountyId) {
      setWards([]);
      return;
    }

    let active = true;
    setLocationsLoading(true);
    const wardsPromise = canSelectFullLocation
      ? locationApi.getWards(principal.subCountyId)
      : assignmentApi.getMyWards();

    wardsPromise
      .then((items) => {
        if (active) setWards(items);
      })
      .catch((error) => {
        console.warn("Failed to load wards:", error);
        if (active) {
          setErrors((prev) => ({
            ...prev,
            principalWardId: "Failed to load wards",
          }));
        }
      })
      .finally(() => {
        if (active) setLocationsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canSelectFullLocation, principal.subCountyId]);

  useEffect(() => {
    if (principal.registrationType !== "GROUP" || !principal.wardId) {
      setGroups([]);
      return;
    }

    let active = true;
    setGroupsLoading(true);
    groupApi
      .getGroups({ wardId: principal.wardId })
      .then((items) => {
        if (active) setGroups(items);
      })
      .catch((error) => {
        console.warn("Failed to load groups:", error);
        if (active) {
          setErrors((prev) => ({
            ...prev,
            principalGroupId: "Failed to load groups",
          }));
        }
      })
      .finally(() => {
        if (active) setGroupsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [principal.registrationType, principal.wardId]);

  const revealSectionsForErrors = useCallback(
    (validationErrors: ValidationError) => {
      const hasPrincipalErrors = [
        validationErrors.principalRegistrationType,
        validationErrors.principalCountyId,
        validationErrors.principalSubCountyId,
        validationErrors.principalWardId,
        validationErrors.principalGroupId,
        validationErrors.principalFirstName,
        validationErrors.principalLastName,
        validationErrors.principalNationalID,
        validationErrors.principalGender,
        validationErrors.principalPhoneNumber,
        validationErrors.principalDateOfBirth,
        validationErrors.principalGroupName,
      ].some((e) => e !== null);
      const hasNokErrors = [
        validationErrors.nextOfKinFirstName,
        validationErrors.nextOfKinLastName,
        validationErrors.nextOfKinRelationship,
        validationErrors.nextOfKinGender,
        validationErrors.nextOfKinIdNumber,
        validationErrors.nextOfKinPhoneNumber,
        validationErrors.nextOfKinDateOfBirth,
      ].some((e) => e !== null);

      if (hasPrincipalErrors) {
        setShowNextOfKin(false);
        setShowDependants(false);
        return;
      }
      if (hasNokErrors) {
        setShowNextOfKin(true);
        setShowDependants(false);
        return;
      }
      if (validationErrors.general) {
        setShowNextOfKin(true);
        setShowDependants(true);
      }
    },
    []
  );

  const focusField = useCallback((fieldId: string) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(fieldId)?.focus();
      });
    });
  }, []);

  const handleErrorLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    item: ErrorSummaryItem
  ) => {
    event.preventDefault();

    if (item.revealDependants) {
      setShowNextOfKin(true);
      setShowDependants(true);
    } else if (item.revealNok) {
      setShowNextOfKin(true);
      setShowDependants(false);
    } else {
      setShowNextOfKin(false);
      setShowDependants(false);
    }

    focusField(item.fieldId);
  };

  useEffect(() => {
    if (showErrorSummary && errorSummaryItems.length > 0) {
      errorSummaryRef.current?.focus();
    }
  }, [showErrorSummary, errorSummaryItems]);

  const addDependant = () => {
    if (!showDependants) {
      setShowDependants(true);
    }
    const newDependant: Dependant = {
      id: Date.now().toString(),
      firstName: "",
      lastName: "",
      relationship: "",
      gender: "",
      phoneNumber: "",
      dateOfBirth: "",
    };
    setDependants([...dependants, newDependant]);
  };

  const updateDependant = (id: string, field: keyof Dependant, value: string) => {
    setDependants(
      dependants.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const removeDependant = (id: string) => {
    setDependants(dependants.filter((d) => d.id !== id));
  };

  const validatePrincipalStep = useCallback(async (): Promise<boolean> => {
    setShowErrorSummary(false);

    let principalErrors = validatePrincipal(principal, initialValidationError);
    const hasLocalErrors = Object.values(principalErrors).some(
      (error) => error !== null
    );

    if (hasLocalErrors) {
      setErrors(principalErrors);
      focusField(
        buildErrorSummaryItems(principalErrors, dependants)[0]?.fieldId ??
          "principal-first-name"
      );
      return false;
    }

    setCheckingPrincipal(true);

    try {
      const duplicateResult = await memberApi.exists({
        nationalId: principal.nationalID,
        phoneNumber: principal.phoneNumber,
      });
      const duplicateNationalId = duplicateResult.nationalIdExists;
      const duplicatePhoneNumber = duplicateResult.phoneNumberExists;

      principalErrors = {
        ...principalErrors,
        principalNationalID: duplicateNationalId
          ? "A member with this National ID already exists"
          : null,
        principalPhoneNumber: duplicatePhoneNumber
          ? "A member with this phone number already exists"
          : null,
      };

      const hasDuplicateErrors = Object.values(principalErrors).some(
        (error) => error !== null
      );

      setErrors(principalErrors);

      if (hasDuplicateErrors) {
        focusField(
          duplicateNationalId
            ? "principal-national-id"
            : "principal-phone-number"
        );
        return false;
      }

      return true;
    } catch (error) {
      console.warn("Failed to check duplicate principal details:", error);
      setErrors({
        ...principalErrors,
        general: "Unable to verify existing members. Please try again.",
      });
      setShowErrorSummary(true);
      return false;
    } finally {
      setCheckingPrincipal(false);
    }
  }, [dependants, focusField, principal]);

  const handleContinueToNextOfKin = async () => {
    const canContinue = await validatePrincipalStep();
    if (canContinue) {
      setShowNextOfKin(true);
    }
  };

  const validateNextOfKinStep = useCallback((): boolean => {
    setShowErrorSummary(false);

    const nextOfKinErrors = validateNextOfKin(
      nextOfKin,
      initialValidationError
    );
    const hasNextOfKinErrors = Object.values(nextOfKinErrors).some(
      (error) => error !== null
    );

    setErrors(nextOfKinErrors);

    if (hasNextOfKinErrors) {
      focusField(
        buildErrorSummaryItems(nextOfKinErrors, dependants)[0]?.fieldId ??
          "nok-first-name"
      );
      return false;
    }

    return true;
  }, [dependants, focusField, nextOfKin]);

  const handleContinueToDependants = () => {
    const canContinue = validateNextOfKinStep();
    if (canContinue) {
      setShowDependants(true);
    }
  };

  const handleSubmit = async () => {
    setShowErrorSummary(false);
    setErrors(initialValidationError);

    try {
      const duplicateResult = await memberApi.exists({
        nationalId: principal.nationalID,
        phoneNumber: principal.phoneNumber,
      });
      const duplicateNationalId = duplicateResult.nationalIdExists;
      const duplicatePhoneNumber = duplicateResult.phoneNumberExists;

      if (duplicateNationalId || duplicatePhoneNumber) {
        const duplicateErrors: ValidationError = {
          ...initialValidationError,
          principalNationalID: duplicateNationalId
            ? "A member with this National ID already exists"
            : null,
          principalPhoneNumber: duplicatePhoneNumber
            ? "A member with this phone number already exists"
            : null,
        };
        setErrors(duplicateErrors);
        setShowNextOfKin(false);
        setShowDependants(false);
        setShowErrorSummary(true);
        return;
      }
    } catch (error) {
      console.warn("Failed to check for duplicate ID:", error);
    }

    let newErrors = validatePrincipal(principal, initialValidationError);
    newErrors = validateNextOfKin(nextOfKin, newErrors);
    newErrors = validateDependants(dependants, newErrors);

    setErrors(newErrors);
    revealSectionsForErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error !== null);
    if (hasErrors) {
      setShowErrorSummary(true);
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmation(false);
    setLoading(true);
    setShowErrorSummary(false);
    setErrors(initialValidationError);

    const convertedDependants: DependantDTO[] = dependants.map((dep) => ({
      firstName: dep.firstName,
      lastName: dep.lastName,
      relationship: dep.relationship as DependantDTO["relationship"],
      gender: dep.gender as DependantDTO["gender"],
      phoneNumber: dep.phoneNumber,
      dateOfBirth: dep.dateOfBirth,
      birthCertificatePath: dep.birthCertificatePath,
    }));

    const payload: RegisterMemberPayload = {
      principal,
      nextOfKin,
      dependants: convertedDependants,
    };

    const result = await registerMember(payload);
    setLoading(false);

    if (result.success && result.memberId) {
      onSuccess(result.memberId);
    } else {
      const serverErrors: ValidationError = {
        ...initialValidationError,
        ...mapApiFieldErrors(result.fieldErrors),
        general: result.error || "Registration failed",
      };
      setErrors(serverErrors);
      revealSectionsForErrors(serverErrors);
      if (!result.fieldErrors || Object.keys(result.fieldErrors).length === 0) {
        setShowDependants(true);
      }
      setShowErrorSummary(true);
    }
  };

  const isPrincipalStep = !showNextOfKin;
  const isNextOfKinStep = showNextOfKin && !showDependants;
  const isDependantsStep = showDependants;

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={onCancel}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-2">
            Register New Member
          </h1>
          <p className="text-gray-600 text-lg">
            Fill in the member&apos;s information below
          </p>
        </div>

        {showErrorSummary && errorSummaryItems.length > 0 && (
          <div
            ref={errorSummaryRef}
            tabIndex={-1}
            role="alert"
            aria-live="assertive"
            aria-labelledby="registration-error-summary-heading"
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl outline-none"
          >
            <h2
              id="registration-error-summary-heading"
              className="text-lg font-semibold text-red-800 mb-3"
            >
              There is a problem with your registration form
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-red-700">
              {errorSummaryItems.map((item) => (
                <li key={item.key}>
                  <a
                    href={`#${item.fieldId}`}
                    onClick={(event) => handleErrorLinkClick(event, item)}
                    className="underline hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                  >
                    {item.linkText}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        )}

        {isPrincipalStep && (
          <>
            <Suspense fallback={<FormSpinner />}>
              <PrincipalMemberForm
                principal={principal}
                onChange={setPrincipal}
                errors={{
                  principalFirstName: errors.principalFirstName,
                  principalLastName: errors.principalLastName,
                  principalNationalID: errors.principalNationalID,
                  principalGender: errors.principalGender,
                  principalPhoneNumber: errors.principalPhoneNumber,
                  principalDateOfBirth: errors.principalDateOfBirth,
                  principalGroupName: errors.principalGroupName ?? null,
                  principalRegistrationType: errors.principalRegistrationType,
                  principalCountyId: errors.principalCountyId,
                  principalSubCountyId: errors.principalSubCountyId,
                  principalWardId: errors.principalWardId,
                  principalGroupId: errors.principalGroupId,
                }}
                counties={counties}
                subCounties={subCounties}
                wards={visibleWards}
                groups={groups}
                locationsLoading={locationsLoading || assignmentLoading}
                groupsLoading={groupsLoading}
                canSelectFullLocation={canSelectFullLocation}
                assignedCountyName={assignment?.countyName ?? user?.countyName}
                assignedSubCountyName={
                  assignment?.subCountyName ?? user?.subCountyName
                }
              />
            </Suspense>

            <div className="mb-8 flex justify-center">
              <button
                type="button"
                onClick={() => void handleContinueToNextOfKin()}
                disabled={checkingPrincipal}
                className="px-6 py-3 border-2 border-blue-200 rounded-xl text-blue-700 font-medium hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingPrincipal ? "Checking details..." : "Continue to Next of Kin"}
              </button>
            </div>
          </>
        )}

        {isNextOfKinStep && (
          <>
            <Suspense fallback={<FormSpinner />}>
              <NextOfKinForm
                nextOfKin={nextOfKin}
                onChange={setNextOfKin}
                errors={{
                  nextOfKinFirstName: errors.nextOfKinFirstName,
                  nextOfKinLastName: errors.nextOfKinLastName,
                  nextOfKinRelationship: errors.nextOfKinRelationship,
                  nextOfKinGender: errors.nextOfKinGender,
                  nextOfKinIdNumber: errors.nextOfKinIdNumber,
                  nextOfKinPhoneNumber: errors.nextOfKinPhoneNumber,
                  nextOfKinDateOfBirth: errors.nextOfKinDateOfBirth,
                }}
              />
            </Suspense>

            <div className="mb-8 flex justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowNextOfKin(false);
                  setShowDependants(false);
                }}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleContinueToDependants}
                className="px-6 py-3 border-2 border-blue-200 rounded-xl text-blue-700 font-medium hover:bg-blue-50 transition-all duration-200"
              >
                Continue to Dependants
              </button>
            </div>
          </>
        )}

        {isDependantsStep && (
          <Suspense fallback={<FormSpinner />}>
            <DependantsForm
              dependants={dependants}
              onChange={setDependants}
              onAdd={addDependant}
              onRemove={removeDependant}
              errors={{ general: errors.general }}
            />
          </Suspense>
        )}

        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Cancel
          </button>
          {isDependantsStep && (
            <button
              type="button"
              onClick={() => setShowDependants(false)}
              className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Previous
            </button>
          )}
          {isDependantsStep && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Registering...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Register Member
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        title="Confirm Registration"
        message={`Are you sure you want to register ${principal.firstName} ${principal.lastName}? This action cannot be undone.`}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirmation(false)}
        confirmText="Register Member"
        cancelText="Cancel"
      />
    </>
  );
}
