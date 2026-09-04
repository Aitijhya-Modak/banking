import { useState } from "react";
import { z } from "zod";
import { api } from "../../lib/api";

const MINIMUM_BALANCE = 50;

const sendMoneySchema = z.object({
  toAccountNo: z.string().trim().min(1, "Recipient account number is required"),
  amount: z
    .number({ error: "Amount must be a number" })
    .positive("Amount must be greater than zero"),
});

interface SendMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromAccountNo: string;
  currentBalance: number;
  onSuccess: () => void;
}

export function SendMoneyModal({
  isOpen,
  onClose,
  fromAccountNo,
  currentBalance,
  onSuccess,
}: SendMoneyModalProps) {
  const [toAccountNo, setToAccountNo] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [errors, setErrors] = useState<{
    toAccountNo?: string;
    amount?: string;
    general?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const numericAmount = parseFloat(amount);

    // 1. Zod Validation
    const validation = sendMoneySchema.safeParse({
      toAccountNo,
      amount: numericAmount,
    });

    if (!validation.success) {
      const fieldErrors: { toAccountNo?: string; amount?: string } = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as "toAccountNo" | "amount";
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // 2. Prevent self-transfer
    if (toAccountNo.trim() === fromAccountNo) {
      setErrors({ toAccountNo: "Cannot send money to the same account" });
      return;
    }

    // 3. Client-side Minimum Balance Check
    const remainingBalance = currentBalance - numericAmount;
    if (remainingBalance < MINIMUM_BALANCE) {
      setErrors({
        amount: `Insufficient funds. Transfer would violate the ₹${MINIMUM_BALANCE} minimum required balance (Available: ₹${currentBalance}).`,
      });
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/transaction/send", {
        fromAccountNo,
        toAccountNo: toAccountNo.trim(),
        amount: numericAmount,
      });

      // Clear state and trigger refresh
      setToAccountNo("");
      setAmount("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrors({
        general:
          err.response?.data?.message ||
          "Failed to process transaction. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-brand-card border border-brand-border/80 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-brand-border/40 pb-4">
          <h2 className="text-lg font-bold font-mono text-brand-text">
            Send Money
          </h2>
          <button
            onClick={onClose}
            className="text-brand-muted hover:text-brand-text transition-colors text-xl font-bold"
          >
            &times;
          </button>
        </div>

        {errors.general && (
          <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-brand-muted mb-1 font-semibold">
              From Account
            </label>
            <input
              type="text"
              value={fromAccountNo}
              disabled
              className="w-full bg-brand-bg/50 border border-brand-border/40 rounded-lg p-2.5 text-sm font-mono text-brand-muted cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-brand-muted mb-1 font-semibold">
              To Account Number
            </label>
            <input
              type="text"
              placeholder="Enter destination account number"
              value={toAccountNo}
              onChange={(e) => setToAccountNo(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border/60 focus:border-brand-accent rounded-lg p-2.5 text-sm font-mono text-brand-text outline-none transition-colors"
            />
            {errors.toAccountNo && (
              <p className="text-red-400 text-xs mt-1">{errors.toAccountNo}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-brand-muted mb-1 font-semibold">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border/60 focus:border-brand-accent rounded-lg p-2.5 text-sm font-mono text-brand-text outline-none transition-colors"
            />
            {errors.amount && (
              <p className="text-red-400 text-xs mt-1">{errors.amount}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border/40">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-mono text-brand-muted hover:text-brand-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-accent hover:bg-brand-accent-hover text-brand-bg font-semibold text-xs px-5 py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {submitting ? "Processing..." : "Confirm Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
