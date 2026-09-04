import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { openAccountSchema, type OpenAccountFormData } from "./types/types";
import { useStaffAuthStore } from "../../hooks/useStaffAuthStore";

export default function OpenAccountPage() {
  const navigate = useNavigate();
  const staff = useStaffAuthStore((state) => state.staff);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<OpenAccountFormData>({
    accountType: "SAVINGS",
    firstName: "",
    middleName: "",
    lastName: "",
    dob: "",
    address: "",
    branchCode: staff?.branch?.branchId || staff?.branch?.id || "BR-MAIN",
    panCard: "",
    aadharCard: "",
    companyName: "",
    taxId: "",
    principalAmount: 10000,
    termMonths: 12,
    interestRate: 8.5,
  });

  const updateField = (field: keyof OpenAccountFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Step-by-step validation logic before navigating forward
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.accountType)
        newErrors.accountType = "Select an account type";
      if (formData.accountType === "BUSINESS") {
        if (!formData.companyName)
          newErrors.companyName = "Company name required";
        if (!formData.taxId) newErrors.taxId = "Tax ID required";
      }
      if (formData.accountType === "LOAN") {
        if (!formData.principalAmount)
          newErrors.principalAmount = "Amount required";
        if (!formData.termMonths) newErrors.termMonths = "Tenure required";
      }
    } else if (step === 2) {
      if (!formData.firstName.trim())
        newErrors.firstName = "First name is required";
      if (!formData.lastName.trim())
        newErrors.lastName = "Last name is required";
      if (!formData.dob) newErrors.dob = "Date of birth is required";
      if (!formData.address.trim()) newErrors.address = "Address is required";
    } else if (step === 3) {
      if (!formData.branchCode) newErrors.branchCode = "Branch is required";
    } else if (step === 4) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      const aadharRegex = /^\d{12}$/;
      if (!panRegex.test(formData.panCard))
        newErrors.panCard = "Invalid PAN card format";
      if (!aadharRegex.test(formData.aadharCard))
        newErrors.aadharCard = "Must be 12 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    } else {
      toast.error("Please fill in all required fields correctly.");
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    const fullResult = openAccountSchema.safeParse(formData);
    if (!fullResult.success) {
      toast.error("Invalid form submission. Please re-check inputs.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Mock API post request
      // await api.post("/accounts/open", fullResult.data);
      toast.success("Account application submitted successfully!");
      navigate("/accounts");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to submit application",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-8 px-4">
        {["Type", "Customer", "Branch", "Verification", "Preview"].map(
          (label, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep === stepNum;
            const isDone = currentStep > stepNum;
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-brand-accent text-brand-bg"
                      : isDone
                        ? "bg-brand-surface-subtle text-brand-accent border border-brand-accent"
                        : "bg-brand-card text-brand-muted border border-brand-border"
                  }`}
                >
                  {stepNum}
                </div>
                <span
                  className={`text-xs hidden sm:inline font-medium ${
                    isActive ? "text-brand-text font-bold" : "text-brand-muted"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          },
        )}
      </div>

      {/* Main Stepper Card with Left/Right Arrows */}
      <div className="relative bg-brand-card border border-brand-border rounded-2xl p-6 sm:p-10 shadow-sm min-h-[420px] flex flex-col justify-between">
        {/* Step 1: Account Type */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-brand-text">
              Select Account Type
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  id: "SAVINGS",
                  title: "Savings",
                  desc: "Everyday banking with standard yield.",
                },
                {
                  id: "BUSINESS",
                  title: "Business",
                  desc: "For commercial & enterprise transactions.",
                },
                {
                  id: "LOAN",
                  title: "Loan Account",
                  desc: "Structured loan borrowing & repayment.",
                },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => updateField("accountType", item.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.accountType === item.id
                      ? "border-brand-accent bg-brand-surface-subtle"
                      : "border-brand-border hover:border-brand-muted"
                  }`}
                >
                  <div className="font-bold text-brand-text">{item.title}</div>
                  <div className="text-xs text-brand-muted mt-1">
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Conditional Fields for Business */}
            {formData.accountType === "BUSINESS" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-brand-border">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                  />
                  {errors.companyName && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.companyName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Tax ID / Business Registration *
                  </label>
                  <input
                    type="text"
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
            )}

            {/* Conditional Fields for Loan */}
            {formData.accountType === "LOAN" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-brand-border">
                <div>
                  <label className="block text-xs font-medium mb-1">
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
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Term (Months) *
                  </label>
                  <input
                    type="number"
                    value={formData.termMonths}
                    onChange={(e) =>
                      updateField("termMonths", Number(e.target.value))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Customer Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-brand-text">
              Customer Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                />
                {errors.firstName && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={formData.middleName}
                  onChange={(e) => updateField("middleName", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                />
                {errors.lastName && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">
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

            <div>
              <label className="block text-xs font-medium mb-1">
                Residential Address *
              </label>
              <textarea
                rows={3}
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
              />
              {errors.address && (
                <p className="text-[11px] text-red-500 mt-1">
                  {errors.address}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Branch Details (Pre-filled and Disabled from Staff object) */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-brand-text">
              Assigned Servicing Branch
            </h2>
            <p className="text-xs text-brand-muted">
              Branch details are automatically associated with your logged-in
              staff account.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium mb-1 text-brand-muted">
                  Branch ID
                </label>
                <input
                  type="text"
                  disabled
                  value={staff?.branch?.branchId || staff?.branch?.id || "N/A"}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface-subtle text-brand-muted text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-brand-muted">
                  Branch Name
                </label>
                <input
                  type="text"
                  disabled
                  value={staff?.branch?.name || "N/A"}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface-subtle text-brand-muted text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-brand-muted">
                  City
                </label>
                <input
                  type="text"
                  disabled
                  value={staff?.branch?.city || "N/A"}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface-subtle text-brand-muted text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-brand-muted">
                  Country
                </label>
                <input
                  type="text"
                  disabled
                  value={staff?.branch?.country || "N/A"}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface-subtle text-brand-muted text-sm cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1 text-brand-muted">
                  Address
                </label>
                <input
                  type="text"
                  disabled
                  value={staff?.branch?.address || "N/A"}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface-subtle text-brand-muted text-sm cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: PAN Card & Verification ID */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-brand-text">
              Verification Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">
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
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm uppercase focus:outline-none focus:border-brand-accent"
                />
                {errors.panCard && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {errors.panCard}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Identity Verification Number (12 Digits) *
                </label>
                <input
                  type="text"
                  placeholder="123456789012"
                  maxLength={12}
                  value={formData.aadharCard}
                  onChange={(e) => updateField("aadharCard", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                />
                {errors.aadharCard && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {errors.aadharCard}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Read-Only Preview */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-brand-text">
                Application Preview
              </h2>
              <p className="text-xs text-brand-muted">
                Review details before submitting. To edit, use the left arrow to
                go back.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-brand-bg p-4 rounded-xl border border-brand-border">
              <div>
                <span className="text-brand-muted">Account Type:</span>{" "}
                <strong className="text-brand-text">
                  {formData.accountType}
                </strong>
              </div>
              <div>
                <span className="text-brand-muted">Branch Code:</span>{" "}
                <strong className="text-brand-text">
                  {formData.branchCode}
                </strong>
              </div>
              <div>
                <span className="text-brand-muted">Full Name:</span>{" "}
                <strong className="text-brand-text">
                  {formData.firstName} {formData.middleName} {formData.lastName}
                </strong>
              </div>
              <div>
                <span className="text-brand-muted">Date of Birth:</span>{" "}
                <strong className="text-brand-text">{formData.dob}</strong>
              </div>
              <div>
                <span className="text-brand-muted">Address:</span>{" "}
                <strong className="text-brand-text">{formData.address}</strong>
              </div>
              <div>
                <span className="text-brand-muted">PAN Card:</span>{" "}
                <strong className="text-brand-text">{formData.panCard}</strong>
              </div>
              <div>
                <span className="text-brand-muted">Identity ID:</span>{" "}
                <strong className="text-brand-text">
                  {formData.aadharCard}
                </strong>
              </div>

              {formData.accountType === "BUSINESS" && (
                <>
                  <div>
                    <span className="text-brand-muted">Company Name:</span>{" "}
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

              {formData.accountType === "LOAN" && (
                <>
                  <div>
                    <span className="text-brand-muted">Principal Amount:</span>{" "}
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

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-brand-accent hover:bg-brand-accent-hover text-brand-bg font-semibold text-xs rounded-lg transition-all shadow-sm"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        )}

        {/* Navigation Arrows on Left and Right (matching wireframe) */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentStep === 1}
          className={`absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-brand-border bg-brand-card flex items-center justify-center text-brand-text shadow-md hover:bg-brand-surface-subtle transition-all ${
            currentStep === 1 ? "opacity-30 cursor-not-allowed" : "opacity-100"
          }`}
        >
          &lt;
        </button>

        {currentStep < 5 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute -right-20 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-brand-border bg-brand-card flex items-center justify-center text-brand-text shadow-md hover:bg-brand-surface-subtle transition-all"
          >
            &gt;
          </button>
        )}
      </div>
    </div>
  );
}
