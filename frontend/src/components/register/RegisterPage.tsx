import { useState, useRef } from "react";
import type {
  ChangeEvent,
  SubmitEvent,
  KeyboardEvent,
  ClipboardEvent,
} from "react";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { toast } from "sonner";
import Logo from "../logo/Logo";
import { api } from "../../lib/api";
import { ROUTES } from "../../constants/routes";

export const AccountType = {
  SAVINGS: "SAVINGS",
  BUSINESS: "BUSINESS",
};

export const registerSchema = z
  .object({
    firstName: z.string().trim().nonempty("First name is required"),
    lastName: z.string().trim().nonempty("Last name is required"),
    middleName: z.string().trim().optional(),
    email: z.email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().nonempty("Please confirm your password"),
    accountType: z.enum(AccountType, {
      error: () => ({ message: "Select a valid account type" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const otpSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  submittedOtp: z
    .string()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d+$/, "Verification code must contain digits only"),
});

type FieldErrors = Partial<
  Record<keyof z.infer<typeof registerSchema>, string>
>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    accountType: AccountType.SAVINGS,
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = registerSchema.safeParse(formData);

    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof FieldErrors;
        if (fieldName && !errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      });
      setFieldErrors(errors);
      toast.error("Please correct the errors in the form.");
      return;
    }

    const { confirmPassword, ...payload } = result.data;
    setIsSubmitting(true);

    try {
      await api.post("/auth/register/initiate", payload);

      toast.success("Verification code sent! Please check your email.");
      setRegisteredEmail(payload.email);
      setStep("otp");
    } catch (err: any) {
      const serverMessage =
        err.response?.data?.message || "Registration failed. Please try again.";

      if (err.response?.status === 409) {
        setFieldErrors({ email: serverMessage });
        toast.error("An account with this email already exists.");
      } else {
        toast.error(serverMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e: SubmitEvent) => {
    e.preventDefault();
    const submittedOtp = otp.join("");

    const validation = otpSchema.safeParse({
      email: registeredEmail,
      submittedOtp,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || "Invalid OTP code");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.post("/auth/register/verify", validation.data);

      toast.success(res.data?.message || "Account Created Successfully!");
      navigate(ROUTES.PUBLIC.LOGIN);
    } catch (err: any) {
      const serverMessage =
        err.response?.data?.message || "Verification failed. Please try again.";

      toast.error(serverMessage);

      if (
        err.response?.status === 429 ||
        serverMessage.includes("Session invalidated") ||
        serverMessage.includes("expired")
      ) {
        setStep("form");
        setOtp(Array(6).fill(""));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);

    try {
      const res = await api.post("/auth/register/resend-otp", {
        email: registeredEmail,
      });

      toast.success(res.data?.message || "OTP resent successfully");
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const serverMessage =
        err.response?.data?.message ||
        "Failed to resend OTP. Please try again.";
      toast.error(serverMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text font-sans selection:bg-brand-accent selection:text-white">
      {/* Header */}
      <header className="px-6 md:px-16 py-6 border-b border-brand-border bg-brand-card">
        <Link
          to={ROUTES.PUBLIC.LANDING}
          className="inline-block hover:opacity-80 transition-opacity duration-200"
        >
          <Logo size={28} />
        </Link>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-xl p-8 sm:p-10 shadow-sm">
          {step === "form" ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-brand-text tracking-tight mb-2">
                  Open an account
                </h1>
                <p className="text-brand-muted text-xs sm:text-sm font-light leading-relaxed">
                  Enter your information below to establish your profile.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="firstName"
                      className="text-xs font-medium text-brand-muted tracking-wide"
                    >
                      First Name <span className="text-brand-accent">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="John"
                      className={`bg-brand-bg border rounded-lg px-3 py-2 text-xs text-brand-text placeholder:text-brand-muted/50 focus:outline-none transition-colors duration-200 ${
                        fieldErrors.firstName
                          ? "border-red-500 focus:border-red-500"
                          : "border-brand-border focus:border-brand-accent"
                      }`}
                    />
                    {fieldErrors.firstName && (
                      <span className="text-[11px] text-red-500 font-light">
                        {fieldErrors.firstName}
                      </span>
                    )}
                  </div>

                  {/* Middle Name */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="middleName"
                      className="text-xs font-medium text-brand-muted tracking-wide"
                    >
                      Middle Name
                    </label>
                    <input
                      type="text"
                      id="middleName"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleChange}
                      placeholder="Robert"
                      className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-accent transition-colors duration-200"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="lastName"
                    className="text-xs font-medium text-brand-muted tracking-wide"
                  >
                    Last Name <span className="text-brand-accent">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    className={`bg-brand-bg border rounded-lg px-3 py-2 text-xs text-brand-text placeholder:text-brand-muted/50 focus:outline-none transition-colors duration-200 ${
                      fieldErrors.lastName
                        ? "border-red-500 focus:border-red-500"
                        : "border-brand-border focus:border-brand-accent"
                    }`}
                  />
                  {fieldErrors.lastName && (
                    <span className="text-[11px] text-red-500 font-light">
                      {fieldErrors.lastName}
                    </span>
                  )}
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-medium text-brand-muted tracking-wide"
                  >
                    Email Address <span className="text-brand-accent">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john.doe@example.com"
                    className={`bg-brand-bg border rounded-lg px-3 py-2 text-xs text-brand-text placeholder:text-brand-muted/50 focus:outline-none transition-colors duration-200 ${
                      fieldErrors.email
                        ? "border-red-500 focus:border-red-500"
                        : "border-brand-border focus:border-brand-accent"
                    }`}
                  />
                  {fieldErrors.email && (
                    <span className="text-[11px] text-red-500 font-light">
                      {fieldErrors.email}
                    </span>
                  )}
                </div>

                {/* Account Type */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="accountType"
                    className="text-xs font-medium text-brand-muted tracking-wide"
                  >
                    Account Type <span className="text-brand-accent">*</span>
                  </label>
                  <select
                    id="accountType"
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                    className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-accent transition-colors duration-200 cursor-pointer"
                  >
                    <option value={AccountType.SAVINGS}>Savings Account</option>
                    <option value={AccountType.BUSINESS}>
                      Business Account
                    </option>
                  </select>
                  {fieldErrors.accountType && (
                    <span className="text-[11px] text-red-500 font-light">
                      {fieldErrors.accountType}
                    </span>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="password"
                    className="text-xs font-medium text-brand-muted tracking-wide"
                  >
                    Password <span className="text-brand-accent">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`bg-brand-bg border rounded-lg px-3 py-2 text-xs text-brand-text placeholder:text-brand-muted/50 focus:outline-none transition-colors duration-200 ${
                      fieldErrors.password
                        ? "border-red-500 focus:border-red-500"
                        : "border-brand-border focus:border-brand-accent"
                    }`}
                  />
                  {fieldErrors.password && (
                    <span className="text-[11px] text-red-500 font-light">
                      {fieldErrors.password}
                    </span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="text-xs font-medium text-brand-muted tracking-wide"
                  >
                    Confirm Password{" "}
                    <span className="text-brand-accent">*</span>
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`bg-brand-bg border rounded-lg px-3 py-2 text-xs text-brand-text placeholder:text-brand-muted/50 focus:outline-none transition-colors duration-200 ${
                      fieldErrors.confirmPassword
                        ? "border-red-500 focus:border-red-500"
                        : "border-brand-border focus:border-brand-accent"
                    }`}
                  />
                  {fieldErrors.confirmPassword && (
                    <span className="text-[11px] text-red-500 font-light">
                      {fieldErrors.confirmPassword}
                    </span>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 text-white font-semibold text-xs px-5 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-sm mt-3 cursor-pointer"
                >
                  {isSubmitting ? "Sending..." : "Open Account"}
                </button>
              </form>

              <p className="text-center text-xs text-brand-muted mt-8 font-light">
                Already have an account?{" "}
                <Link
                  to={ROUTES.PUBLIC.LOGIN}
                  className="text-brand-accent hover:text-brand-accent-hover font-medium transition-colors duration-200"
                >
                  Log in
                </Link>
              </p>
            </>
          ) : (
            /* Integrated OTP Verification Step */
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-brand-text tracking-tight mb-2">
                  Verify your email
                </h2>
                <p className="text-brand-muted text-xs font-light leading-relaxed">
                  We sent a 6-digit verification code to{" "}
                  <span className="text-brand-text font-medium">
                    {registeredEmail}
                  </span>
                  .
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* Pin Inputs */}
                <div className="flex justify-between gap-2 my-4">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-11 h-12 text-center text-lg font-semibold bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-accent transition-colors duration-200"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 text-white font-semibold text-xs px-5 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? "Verifying..." : "Verify Code"}
                </button>
              </form>

              <div className="flex flex-col items-center gap-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className="text-brand-accent hover:text-brand-accent-hover hover:underline disabled:opacity-50 font-medium cursor-pointer"
                >
                  {isResending ? "Resending..." : "Resend Code"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="text-brand-muted hover:text-brand-text transition-colors duration-200 font-light mt-2 cursor-pointer"
                >
                  &larr; Back to registration
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
