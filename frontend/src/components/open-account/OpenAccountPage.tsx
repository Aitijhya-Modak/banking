// Location: src/pages/OpenAccountPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useStaffAuthStore } from "../../hooks/useStaffAuthStore";
import { api } from "../../lib/api";

interface OpenAccountFormData {
  type: "SAVINGS" | "BUSINESS" | "LOAN";
  accountHolderFirstName: string;
  accountHolderMiddleName: string;
  accountHolderLastName: string;
  accountHolderEmail: string;
  dob: string;
  branchId: string;
  panCard: string;
  identityVerificationNo: string;
  companyName: string;
  taxId: string;
  principalAmount: number;
  termMonths: number;
  interestRate: number;
  accountHolderAddress: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    pincode: string;
    country: string;
  };
}

const STEPS = [
  { id: 1, title: "Account Type", desc: "Select tier & details" },
  { id: 2, title: "Customer Info", desc: "Personal identity" },
  { id: 3, title: "Address", desc: "Residential location" },
  { id: 4, title: "Branch", desc: "Assigned center" },
  { id: 5, title: "Verification", desc: "Tax & ID checks" },
  { id: 6, title: "Review", desc: "Final confirmation" },
];

export default function OpenAccountPage() {
  const navigate = useNavigate();
  const staff = useStaffAuthStore((state) => state.staff);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<OpenAccountFormData>({
    type: "SAVINGS",
    accountHolderFirstName: "",
    accountHolderMiddleName: "",
    accountHolderLastName: "",
    accountHolderEmail: "",
    dob: "",
    branchId: staff?.branch?.id || staff?.branch?.branchId || "",
    panCard: "",
    identityVerificationNo: "",
    companyName: "",
    taxId: "",
    principalAmount: 10000,
    termMonths: 12,
    interestRate: 8.5,
    accountHolderAddress: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      pincode: "",
      country: "India",
    },
  });

  const updateField = (field: keyof OpenAccountFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const updateAddressField = (
    field: keyof OpenAccountFormData["accountHolderAddress"],
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      accountHolderAddress: {
        ...prev.accountHolderAddress,
        [field]: value,
      },
    }));
    if (errors[`address.${field}`]) {
      setErrors((prev) => ({ ...prev, [`address.${field}`]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.type) newErrors.type = "Select an account type";
      if (formData.type === "BUSINESS") {
        if (!formData.companyName.trim())
          newErrors.companyName = "Company name is required";
        if (!formData.taxId.trim()) newErrors.taxId = "Tax ID is required";
      }
      if (formData.type === "LOAN") {
        if (!formData.principalAmount || formData.principalAmount <= 0)
          newErrors.principalAmount = "Principal amount must be positive";
        if (!formData.termMonths || formData.termMonths <= 0)
          newErrors.termMonths = "Tenure must be at least 1 month";
      }
    } else if (step === 2) {
      if (!formData.accountHolderFirstName.trim())
        newErrors.accountHolderFirstName = "First name is required";
      if (!formData.accountHolderLastName.trim())
        newErrors.accountHolderLastName = "Last name is required";
      if (!formData.accountHolderEmail.trim())
        newErrors.accountHolderEmail = "Email address is required";
      if (!formData.dob) newErrors.dob = "Date of birth is required";
    } else if (step === 3) {
      if (!formData.accountHolderAddress.addressLine1.trim())
        newErrors["address.addressLine1"] = "Address Line 1 is required";
      if (!formData.accountHolderAddress.city.trim())
        newErrors["address.city"] = "City is required";
      if (!formData.accountHolderAddress.pincode.trim())
        newErrors["address.pincode"] = "Pincode is required";
      if (!formData.accountHolderAddress.country.trim())
        newErrors["address.country"] = "Country is required";
    } else if (step === 4) {
      if (!formData.branchId) newErrors.branchId = "Branch assignment required";
    } else if (step === 5) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      const identityRegex = /^\d{12}$/;
      if (!panRegex.test(formData.panCard))
        newErrors.panCard = "Invalid PAN format (e.g., ABCDE1234F)";
      if (!identityRegex.test(formData.identityVerificationNo))
        newErrors.identityVerificationNo = "Must be a 12-digit numeric code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    } else {
      toast.error("Please resolve the highlighted validation errors.");
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    const payload = {
      type: formData.type,
      accountHolderFirstName: formData.accountHolderFirstName,
      accountHolderMiddleName: formData.accountHolderMiddleName || undefined,
      accountHolderLastName: formData.accountHolderLastName,
      accountHolderEmail: formData.accountHolderEmail,
      branchId: formData.branchId,

      accountHolderAddress: {
        addressLine1: formData.accountHolderAddress.addressLine1,
        addressLine2: formData.accountHolderAddress.addressLine2 || undefined,
        city: formData.accountHolderAddress.city,
        pincode: formData.accountHolderAddress.pincode,
        country: formData.accountHolderAddress.country,
      },

      companyName:
        formData.type === "BUSINESS" ? formData.companyName : undefined,
      taxId: formData.type === "BUSINESS" ? formData.taxId : undefined,

      principalAmount:
        formData.type === "LOAN" ? formData.principalAmount : undefined,
      interestRate:
        formData.type === "LOAN" ? formData.interestRate : undefined,
      termMonths: formData.type === "LOAN" ? formData.termMonths : undefined,
    };

    try {
      setIsSubmitting(true);
      const result = await api.post("/account/open-account", payload);
      toast.success("Account opened succesfully");
      console.log(result);
      console.log(result.data);
      console.log(result.data.accountDetails);
      console.log(result.data.accountDetails.accountNo);
      navigate(`/account/${result.data.accountDetails.accountNo}`);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to submit application",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 -mt-6 space-y-6">
      {/* Header Banner */}
      <div className="border border-brand-border bg-brand-card/50 backdrop-blur p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-brand-accent">
            Core Banking Portal
          </span>
          <h1 className="text-2xl font-extrabold text-brand-text">
            Customer Account Onboarding
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Create verified savings, commercial business, or loan accounts.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-brand-surface-subtle border border-brand-border text-xs text-brand-muted">
          Step <strong className="text-brand-text">{currentStep}</strong> of{" "}
          {STEPS.length}
        </div>
      </div>

      {/* Modern Stepper Indicator Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-brand-card p-3 rounded-2xl border border-brand-border shadow-xs">
        {STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => step.id < currentStep && setCurrentStep(step.id)}
              disabled={step.id > currentStep}
              className={`flex flex-col items-start p-2.5 rounded-xl text-left transition-all ${
                isActive
                  ? "bg-brand-surface-subtle border border-brand-accent/40 shadow-xs"
                  : isDone
                    ? "hover:bg-brand-surface-subtle/50 cursor-pointer"
                    : "opacity-40 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-brand-accent text-brand-bg shadow-xs"
                      : isDone
                        ? "bg-brand-accent/20 text-brand-accent border border-brand-accent/40"
                        : "bg-brand-bg text-brand-muted border border-brand-border"
                  }`}
                >
                  {isDone ? "✓" : step.id}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    isActive ? "text-brand-text font-bold" : "text-brand-muted"
                  }`}
                >
                  {step.title}
                </span>
              </div>
              <span className="text-[10px] text-brand-muted hidden md:block">
                {step.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="relative bg-brand-card border border-brand-border rounded-2xl p-6 sm:p-10 shadow-sm min-h-120 flex flex-col justify-between">
        {/* STEP 1: Account Type */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-brand-text">
                Select Account Type
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Choose the structural product type for this customer setup.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  id: "SAVINGS",
                  title: "Savings Account",
                  desc: "Individual deposit account with standard interest rates and daily yield.",
                  badge: "Standard",
                },
                {
                  id: "BUSINESS",
                  title: "Business Account",
                  desc: "Designed for commercial entities with custom tax and entity verification.",
                  badge: "Enterprise",
                },
                {
                  id: "LOAN",
                  title: "Loan Account",
                  desc: "Structured credit borrowing profile linked to installment terms.",
                  badge: "Credit",
                },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => updateField("type", item.id)}
                  className={`p-5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    formData.type === item.id
                      ? "border-brand-accent bg-brand-surface-subtle ring-1 ring-brand-accent/30 shadow-xs"
                      : "border-brand-border bg-brand-bg/40 hover:border-brand-muted"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm text-brand-text">
                        {item.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-card border border-brand-border text-brand-muted font-medium">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-brand-border/40 text-[11px] font-semibold text-brand-accent">
                    {formData.type === item.id ? "● Selected" : "Select tier"}
                  </div>
                </button>
              ))}
            </div>

            {/* Business Conditional Input Card */}
            {formData.type === "BUSINESS" && (
              <div className="p-5 rounded-xl border border-brand-border bg-brand-surface-subtle/60 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                  Business Entity Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-brand-text">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Nexus Tech Ltd"
                      value={formData.companyName}
                      onChange={(e) =>
                        updateField("companyName", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                    />
                    {errors.companyName && (
                      <p className="text-[11px] text-red-500 mt-1">
                        {errors.companyName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-brand-text">
                      Tax Registration ID *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TAX-8830192"
                      value={formData.taxId}
                      onChange={(e) => updateField("taxId", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                    />
                    {errors.taxId && (
                      <p className="text-[11px] text-red-500 mt-1">
                        {errors.taxId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Loan Conditional Input Card */}
            {formData.type === "LOAN" && (
              <div className="p-5 rounded-xl border border-brand-border bg-brand-surface-subtle/60 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                  Loan Financing Terms
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-brand-text">
                      Principal Amount (₹) *
                    </label>
                    <input
                      type="number"
                      value={formData.principalAmount}
                      onChange={(e) =>
                        updateField("principalAmount", Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                    />
                    {errors.principalAmount && (
                      <p className="text-[11px] text-red-500 mt-1">
                        {errors.principalAmount}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-brand-text">
                      Term Duration (Months) *
                    </label>
                    <input
                      type="number"
                      value={formData.termMonths}
                      onChange={(e) =>
                        updateField("termMonths", Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                    />
                    {errors.termMonths && (
                      <p className="text-[11px] text-red-500 mt-1">
                        {errors.termMonths}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-brand-text">
                      Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.interestRate}
                      onChange={(e) =>
                        updateField("interestRate", Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Customer Primary Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-brand-text">
                Personal Identity Details
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Provide legal account holder details matching official records.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-brand-text">
                  First Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. John"
                  value={formData.accountHolderFirstName}
                  onChange={(e) =>
                    updateField("accountHolderFirstName", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                />
                {errors.accountHolderFirstName && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {errors.accountHolderFirstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-brand-text">
                  Middle Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Robert"
                  value={formData.accountHolderMiddleName}
                  onChange={(e) =>
                    updateField("accountHolderMiddleName", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-brand-text">
                  Last Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Doe"
                  value={formData.accountHolderLastName}
                  onChange={(e) =>
                    updateField("accountHolderLastName", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                />
                {errors.accountHolderLastName && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {errors.accountHolderLastName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-brand-text">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="john.doe@domain.com"
                  value={formData.accountHolderEmail}
                  onChange={(e) =>
                    updateField("accountHolderEmail", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                />
                {errors.accountHolderEmail && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {errors.accountHolderEmail}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-brand-text">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => updateField("dob", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                />
                {errors.dob && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.dob}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Customer Address Details (Dedicated Step) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-brand-text">
                Residential Location
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Structured address information linked directly to the primary
                account owner.
              </p>
            </div>

            <div className="space-y-4 bg-brand-surface-subtle/30 p-5 rounded-xl border border-brand-border">
              <div>
                <label className="block text-xs font-medium mb-1 text-brand-text">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  placeholder="House/Flat No., Street Name, Landmark"
                  value={formData.accountHolderAddress.addressLine1}
                  onChange={(e) =>
                    updateAddressField("addressLine1", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                />
                {errors["address.addressLine1"] && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {errors["address.addressLine1"]}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-brand-text">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Apartment, suite, unit, or floor"
                  value={formData.accountHolderAddress.addressLine2}
                  onChange={(e) =>
                    updateAddressField("addressLine2", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1 text-brand-text">
                    City *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={formData.accountHolderAddress.city}
                    onChange={(e) => updateAddressField("city", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                  />
                  {errors["address.city"] && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors["address.city"]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-brand-text">
                    Pincode / Postal Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 400001"
                    value={formData.accountHolderAddress.pincode}
                    onChange={(e) =>
                      updateAddressField("pincode", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                  />
                  {errors["address.pincode"] && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors["address.pincode"]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-brand-text">
                    Country *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. India"
                    value={formData.accountHolderAddress.country}
                    onChange={(e) =>
                      updateAddressField("country", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                  />
                  {errors["address.country"] && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors["address.country"]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Branch Details */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-brand-text">
                Assigned Servicing Branch
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Automatically associated based on current active staff session
                details.
              </p>
            </div>

            <div className="bg-brand-surface-subtle border border-brand-border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                  Branch Information
                </span>
                <span className="text-[10px] bg-brand-card px-2.5 py-1 rounded-full text-brand-muted border border-brand-border font-medium">
                  Auto-Assigned
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1">
                    Branch Identifier
                  </label>
                  <input
                    type="text"
                    disabled
                    value={staff?.branch?.branchId || "BR-MAIN"}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-card/60 text-brand-text text-sm font-mono cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={staff?.branch?.name || "Main Regional Branch"}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-card/60 text-brand-text text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1">
                    City Location
                  </label>
                  <input
                    type="text"
                    disabled
                    value={staff?.branch?.city || "Central Region"}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-card/60 text-brand-text text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    disabled
                    value={staff?.branch?.country || "India"}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-card/60 text-brand-text text-sm cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Verification Documents */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-brand-text">
                Regulatory Verification Details
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Verify identity documentation against national banking
                standards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-brand-surface-subtle/30 p-6 rounded-xl border border-brand-border">
              <div>
                <label className="block text-xs font-medium mb-1 text-brand-text">
                  PAN Card Number *
                </label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  value={formData.panCard}
                  onChange={(e) =>
                    updateField("panCard", e.target.value.toUpperCase())
                  }
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm uppercase font-mono tracking-wider focus:outline-none focus:border-brand-accent"
                />
                {errors.panCard && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {errors.panCard}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-brand-text">
                  Identity Verification Number (12 Digits) *
                </label>
                <input
                  type="text"
                  placeholder="123456789012"
                  maxLength={12}
                  value={formData.identityVerificationNo}
                  onChange={(e) =>
                    updateField("identityVerificationNo", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm font-mono tracking-wider focus:outline-none focus:border-brand-accent"
                />
                {errors.identityVerificationNo && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {errors.identityVerificationNo}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Form Application Summary Review */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-brand-text">
                Application Summary Review
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Please double-check customer and account details before
                submitting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-brand-border bg-brand-bg space-y-2">
                <div className="font-bold text-brand-accent uppercase tracking-wider text-[11px]">
                  Account Configuration
                </div>
                <div>
                  <span className="text-brand-muted">Account Type:</span>{" "}
                  <strong className="text-brand-text">{formData.type}</strong>
                </div>
                {formData.type === "BUSINESS" && (
                  <>
                    <div>
                      <span className="text-brand-muted">Company:</span>{" "}
                      <strong className="text-brand-text">
                        {formData.companyName}
                      </strong>
                    </div>
                    <div>
                      <span className="text-brand-muted">Tax ID:</span>{" "}
                      <strong className="text-brand-text">
                        {formData.taxId}
                      </strong>
                    </div>
                  </>
                )}
                {formData.type === "LOAN" && (
                  <>
                    <div>
                      <span className="text-brand-muted">Principal:</span>{" "}
                      <strong className="text-brand-text">
                        ₹{formData.principalAmount}
                      </strong>
                    </div>
                    <div>
                      <span className="text-brand-muted">Tenure:</span>{" "}
                      <strong className="text-brand-text">
                        {formData.termMonths} Months
                      </strong>
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 rounded-xl border border-brand-border bg-brand-bg space-y-2">
                <div className="font-bold text-brand-accent uppercase tracking-wider text-[11px]">
                  Customer Identity
                </div>
                <div>
                  <span className="text-brand-muted">Full Name:</span>{" "}
                  <strong className="text-brand-text">
                    {formData.accountHolderFirstName}{" "}
                    {formData.accountHolderMiddleName}{" "}
                    {formData.accountHolderLastName}
                  </strong>
                </div>
                <div>
                  <span className="text-brand-muted">Email:</span>{" "}
                  <strong className="text-brand-text">
                    {formData.accountHolderEmail}
                  </strong>
                </div>
                <div>
                  <span className="text-brand-muted">Date of Birth:</span>{" "}
                  <strong className="text-brand-text">{formData.dob}</strong>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-brand-border bg-brand-bg space-y-2">
                <div className="font-bold text-brand-accent uppercase tracking-wider text-[11px]">
                  Address Details
                </div>
                <div>
                  <span className="text-brand-muted">Street:</span>{" "}
                  <strong className="text-brand-text">
                    {formData.accountHolderAddress.addressLine1}
                    {formData.accountHolderAddress.addressLine2
                      ? `, ${formData.accountHolderAddress.addressLine2}`
                      : ""}
                  </strong>
                </div>
                <div>
                  <span className="text-brand-muted">City / Pin:</span>{" "}
                  <strong className="text-brand-text">
                    {formData.accountHolderAddress.city} -{" "}
                    {formData.accountHolderAddress.pincode}
                  </strong>
                </div>
                <div>
                  <span className="text-brand-muted">Country:</span>{" "}
                  <strong className="text-brand-text">
                    {formData.accountHolderAddress.country}
                  </strong>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-brand-border bg-brand-bg space-y-2">
                <div className="font-bold text-brand-accent uppercase tracking-wider text-[11px]">
                  Assigned Branch & Identity
                </div>
                <div>
                  <span className="text-brand-muted">Branch ID:</span>{" "}
                  <strong className="text-brand-text">
                    {formData.branchId}
                  </strong>
                </div>
                <div>
                  <span className="text-brand-muted">PAN Card:</span>{" "}
                  <strong className="text-brand-text">
                    {formData.panCard}
                  </strong>
                </div>
                <div>
                  <span className="text-brand-muted">Identity ID:</span>{" "}
                  <strong className="text-brand-text">
                    {formData.identityVerificationNo}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Stepper Controls */}
        <div className="flex items-center justify-between pt-8 border-t border-brand-border mt-8">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`px-5 py-2 rounded-xl border border-brand-border text-xs font-semibold text-brand-text transition-all ${
              currentStep === 1
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-brand-surface-subtle"
            }`}
          >
            ← Previous
          </button>

          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 bg-brand-accent hover:bg-brand-accent-hover text-brand-bg font-semibold text-xs rounded-xl transition-all shadow-xs"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-brand-accent hover:bg-brand-accent-hover text-brand-bg font-bold text-xs rounded-xl transition-all shadow-xs"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
