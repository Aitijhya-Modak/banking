import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import { useNavigate } from "react-router";
import { z } from "zod";
import { toast } from "sonner";
import Logo from "../logo/Logo";
import { api } from "../../lib/api";
import { useStaffAuthStore } from "../../hooks/useStaffAuthStore";

// 1. Zod Schema for Staff Login Input Validation
export const staffLoginSchema = z.object({
  bankerEmail: z.email("Please enter a valid email address"),
  password: z.string().min(8, "Password should be minimum 8 characters"),
});

type FieldErrors = Partial<
  Record<keyof z.infer<typeof staffLoginSchema>, string>
>;

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const setStaff = useStaffAuthStore((state) => state.setStaff);

  const [formData, setFormData] = useState({
    bankerEmail: "",
    password: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});

    const result = staffLoginSchema.safeParse(formData);

    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof FieldErrors;
        if (fieldName && !errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      });
      setFieldErrors(errors);
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/staff/auth/login", result.data);
      console.log(response);
      const staffData = response.data.data;

      if (staffData) {
        setStaff(staffData);
      }

      toast.success(response.data.message || "Login successful!");
      console.log("navigating to account");
      navigate("/account", { replace: true });
    } catch (err: any) {
      const serverMessage =
        err.response?.data?.message ||
        "Authentication failed. Please try again.";

      if (err.response?.status === 401) {
        toast.error("Invalid banker email or password.");
      } else {
        toast.error(serverMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-brand-accent selection:text-white">
      {/* Outer Card Container */}
      <div className="w-full max-w-5xl bg-brand-card border border-brand-border rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-145">
        {/* LEFT SECTION: Login Form */}
        <div className="md:col-span-6 lg:col-span-5 p-8 sm:p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-brand-border">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-brand-text">
              Staff Portal
            </h1>
            <p className="text-xs text-brand-muted mt-1.5">
              Sign in with your internal credentials to access the console.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email Input */}
            <div>
              <label
                htmlFor="bankerEmail"
                className="block text-xs font-semibold text-brand-text mb-2"
              >
                Banker Email
              </label>
              <input
                id="bankerEmail"
                name="bankerEmail"
                type="email"
                placeholder="name@ambank.internal"
                value={formData.bankerEmail}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full px-3.5 py-2.5 bg-brand-bg border ${
                  fieldErrors.bankerEmail
                    ? "border-red-500 focus:ring-red-500"
                    : "border-brand-border focus:border-brand-accent focus:ring-brand-accent"
                } rounded-lg text-sm text-brand-text outline-none transition-all duration-200 focus:ring-1 disabled:opacity-50`}
              />
              {fieldErrors.bankerEmail && (
                <p className="text-xs text-red-500 mt-1.5">
                  {fieldErrors.bankerEmail}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-brand-text mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full px-3.5 py-2.5 bg-brand-bg border ${
                  fieldErrors.password
                    ? "border-red-500 focus:ring-red-500"
                    : "border-brand-border focus:border-brand-accent focus:ring-brand-accent"
                } rounded-lg text-sm text-brand-text outline-none transition-all duration-200 focus:ring-1 disabled:opacity-50`}
              />
              {fieldErrors.password && (
                <p className="text-xs text-red-500 mt-1.5">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold text-sm py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              {isSubmitting ? "Authenticating..." : "Sign In to Console"}
            </button>
          </form>
        </div>

        {/* RIGHT SECTION: Name, Caption, Disclaimer, Employee Only Notice */}
        <div className="md:col-span-6 lg:col-span-7 bg-brand-surface-subtle p-8 sm:p-12 flex flex-col justify-between">
          {/* Header & Logo */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Logo size={32} />
            </div>

            {/* Caption */}
            <h2 className="text-2xl font-bold text-brand-text leading-snug">
              Secure Staff Workspace
            </h2>
            <p className="text-sm text-brand-muted mt-2 leading-relaxed">
              Internal portal for managing customer accounts, transactions, and
              banking operations safely and efficiently.
            </p>
          </div>

          {/* Footer Information & Disclaimer */}
          <div className="mt-12 pt-6 border-t border-brand-border/60 space-y-4">
            {/* Employee Only Banner */}
            <div className="inline-flex items-center gap-2 bg-brand-card border border-brand-border px-3 py-1.5 rounded-md text-xs font-semibold text-brand-accent">
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
              RESTRICTED ACCESS — AUTHORIZED EMPLOYEES ONLY
            </div>

            {/* Disclaimer Text */}
            <p className="text-[11px] text-brand-muted leading-relaxed">
              <strong>Security Disclaimer:</strong> Unauthorised access attempts
              or misuse of this internal console are strictly prohibited and
              monitored under system audit logs. All actions performed within
              this session are logged for security and compliance purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
