import { useCallback, useEffect, useState, type SubmitEvent } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { api } from "../../lib/api";

/* =========================================================
   ENUM TYPES
========================================================= */

export type AccountType = "SAVINGS" | "BUSINESS" | "LOAN";

export type AccountStatus = "OPEN" | "CLOSED" | "FROZEN";

export type TransactionType = "TRANSFER" | "DEPOSIT" | "WITHDRAWAL";

/* =========================================================
   ADDRESS
========================================================= */

export interface Address {
  id: string;
  pincode: string;
  city: string;
  country: string;
  addressLine1: string;
  addressLine2: string | null;
}

/* =========================================================
   LOAN
========================================================= */

export interface LoanDetails {
  id: string;
  accountId: string;
  principalAmount: number | string;
  interestRate: number | string;
  termMonths: number;
  createdAt: string;
}

/* =========================================================
   BUSINESS
========================================================= */

export interface BusinessDetails {
  id: string;
  accountId?: string;
  taxId: string;
  companyName: string;
  createdAt?: string;
  updatedAt?: string;
}

/* =========================================================
   BRANCH
========================================================= */

export interface Branch {
  branchId: string;
}

/* =========================================================
   ACCOUNT REFERENCE
========================================================= */

export interface AccountRef {
  id: string;
  accountNo: string;
  accountHolderFirstName: string;
  accountHolderLastName: string;
}

/* =========================================================
   TRANSACTION
========================================================= */

export interface Transaction {
  id: string;
  transactionType: TransactionType;

  /*
   * Prisma Decimal is serialized to a string
   * in the JSON response.
   */
  amount: number | string;

  senderId: string | null;
  receiverId: string | null;

  /*
   * Date becomes a string after JSON serialization.
   */
  createdAt: string;

  senderAccount: AccountRef | null;
  receiverAccount: AccountRef | null;
}

/* =========================================================
   PAGINATION
========================================================= */

export interface PaginationMeta {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/* =========================================================
   TRANSACTION API RESPONSE

   IMPORTANT:

   Your actual backend response is:

   {
     success: true,
     data: [...],
     pagination: {...}
   }

   NOT:

   {
     success: true,
     data: {
       transactions: [...],
       pagination: {...}
     }
   }
========================================================= */

export interface TransactionApiResponse {
  success: boolean;
  data: Transaction[];
  pagination: PaginationMeta;
}

/* =========================================================
   ACCOUNT
========================================================= */

export interface AccountData {
  id: string;

  accountNo: string;

  accountHolderFirstName: string;
  accountHolderMiddleName: string | null;
  accountHolderLastName: string;

  accountHolderEmail: string;

  accountHolderAddressId: string;

  accountHolderFullName: string;

  type: AccountType;

  accountStatus: AccountStatus;

  branchId: string;

  branch: Branch;

  accountHolderAddress: Address;

  balance: number | string;

  loanDetails: LoanDetails | null;

  businessDetails: BusinessDetails | null;

  createdAt: string;
  updatedAt: string;

  /*
   * These are returned by your account endpoint.
   * They aren't required for this page because we
   * separately fetch paginated transactions.
   */
  sentTransactions: Transaction[];
  receivedTransactions: Transaction[];
}

/* =========================================================
   ACCOUNT API RESPONSE
========================================================= */

export interface AccountApiResponse {
  success: boolean;
  data: AccountData;
}

/* =========================================================
   MODAL
========================================================= */

type ModalType = "TRANSFER" | "DEPOSIT" | "WITHDRAW" | "PAY" | null;

/* =========================================================
   COMPONENT
========================================================= */

export default function AccountDetailsPage() {
  const { accountNo } = useParams<{ accountNo: string }>();

  /* =======================================================
     ACCOUNT STATE
  ======================================================= */

  const [account, setAccount] = useState<AccountData | null>(null);

  const [isAccountLoading, setIsAccountLoading] = useState(true);

  /* =======================================================
     TRANSACTION STATE
  ======================================================= */

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [isTxLoading, setIsTxLoading] = useState(true);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [totalRecords, setTotalRecords] = useState(0);

  /* =======================================================
     FILTERS
  ======================================================= */

  const [transactionType, setTransactionType] = useState<TransactionType | "">(
    "",
  );

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  /* =======================================================
     MODALS
  ======================================================= */

  const [activeModal, setActiveModal] = useState<ModalType>(null);

  /* =======================================================
     TRANSFER FORM
  ======================================================= */

  const [transferForm, setTransferForm] = useState({
    receiverAccountNo: "",
    ifscCode: "",
    receiverName: "",
    amount: "",
  });

  /* =======================================================
     DEPOSIT / WITHDRAW
  ======================================================= */

  const [depositAmount, setDepositAmount] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [payAmount, setPayAmount] = useState("");

  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  /* =========================================================
     FETCH ACCOUNT
  ========================================================= */

  const fetchAccount = useCallback(async () => {
    if (!accountNo) return;

    setIsAccountLoading(true);

    try {
      const response = await api.get<AccountApiResponse>(
        `/account/${accountNo}`,
      );

      /*
       * Backend:
       *
       * {
       *   success: true,
       *   data: account
       * }
       *
       * Therefore:
       *
       * response.data.data
       *        ↓
       * AccountData
       */

      setAccount(response.data.data);
    } catch (error: any) {
      console.error("Account fetch error:", error);

      toast.error(
        error?.response?.data?.message || "Failed to fetch account details",
      );
    } finally {
      setIsAccountLoading(false);
    }
  }, [accountNo]);

  /* =========================================================
     FETCH TRANSACTIONS
========================================================= */

  const fetchTransactions = useCallback(async () => {
    if (!accountNo) return;

    setIsTxLoading(true);

    try {
      const response = await api.get<TransactionApiResponse>("/transaction", {
        params: {
          accountNo,

          page,

          limit: 5,

          ...(transactionType ? { transactionType } : {}),

          ...(startDate ? { startDate } : {}),

          ...(endDate ? { endDate } : {}),

          sortBy: "createdAt",

          sortOrder: "desc",
        },
      });

      /*
       * IMPORTANT:
       *
       * Your actual API response is:
       *
       * {
       *   success: true,
       *   data: [...transactions],
       *   pagination: {...}
       * }
       *
       * Therefore:
       *
       * response.data.data
       *       -> Transaction[]
       *
       * response.data.pagination
       *       -> PaginationMeta
       */

      setTransactions(response.data.data ?? []);

      setTotalPages(response.data.pagination?.totalPages ?? 1);

      setTotalRecords(response.data.pagination?.totalRecords ?? 0);
    } catch (error: any) {
      console.error("Transaction fetch error:", error);

      toast.error(
        error?.response?.data?.message || "Failed to fetch transactions",
      );
    } finally {
      setIsTxLoading(false);
    }
  }, [accountNo, page, transactionType, startDate, endDate]);

  /* =========================================================
     EFFECTS
  ========================================================= */

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleTypeChange = (value: TransactionType | "") => {
    setTransactionType(value);
    setPage(1);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setPage(1);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setPage(1);
  };

  const clearFilters = () => {
    setTransactionType("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const closeModal = () => {
    if (isActionSubmitting) return;

    setActiveModal(null);
  };

  const handlePaySubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    if (!accountNo) return;

    setIsActionSubmitting(true);

    try {
      await api.post("/transaction/pay-emi", {
        accountNo,
        amount: Number(payAmount),
      });

      toast.success(`Successfully paid ₹${payAmount}`);

      setPayAmount("");
      setActiveModal(null);

      window.location.reload();
    } catch (error: any) {
      console.error("EMI payment error:", error);

      toast.error(error?.response?.data?.message || "EMI payment failed");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!accountNo) return;

    setIsActionSubmitting(true);

    try {
      await api.post("/transaction/transfer", {
        senderAccountNo: accountNo,
        receiverAccountNo: transferForm.receiverAccountNo.trim(),
        amount: Number(transferForm.amount),
      });

      toast.success(`Successfully transferred ₹${transferForm.amount}`);

      setTransferForm({
        receiverAccountNo: "",
        ifscCode: "",
        receiverName: "",
        amount: "",
      });

      setActiveModal(null);

      await Promise.all([fetchAccount(), fetchTransactions()]);
      window.location.reload();
    } catch (error: any) {
      console.error("Transfer error:", error);
      toast.error(error?.response?.data?.message || "Transfer failed");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleDepositSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!accountNo) return;

    console.log(accountNo);
    setIsActionSubmitting(true);

    try {
      await api.post("/transaction/deposit", {
        accountNo,
        amount: Number(depositAmount),
      });

      toast.success(`Successfully deposited ₹${depositAmount}`);

      setDepositAmount("");

      setActiveModal(null);

      await Promise.all([fetchAccount(), fetchTransactions()]);
      window.location.reload();
    } catch (error: any) {
      console.error("Deposit error:", error);
      toast.error(error?.response?.data?.message || "Deposit failed");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!accountNo) return;
    if (!account) return;
    if (withdrawAmount >= account?.balance) {
      toast.error("Withdraw amount more than balance");
      return;
    }
    setIsActionSubmitting(true);

    try {
      await api.post("/transaction/withdraw", {
        accountNo,
        amount: Number(withdrawAmount),
      });

      toast.success(`Successfully withdrew ₹${withdrawAmount}`);

      setWithdrawAmount("");

      setActiveModal(null);

      await Promise.all([fetchAccount(), fetchTransactions()]);
      window.location.reload();
    } catch (error: any) {
      console.error("Withdraw error:", error);
      toast.error(error?.response?.data?.message || "Withdrawal failed");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  if (isAccountLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-brand-muted text-sm font-medium">
        Loading account details...
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-brand-muted text-sm font-medium">
        Account not found.
      </div>
    );
  }

  const fullName =
    account.accountHolderFullName ||
    [
      account.accountHolderFirstName,
      account.accountHolderMiddleName,
      account.accountHolderLastName,
    ]
      .filter(Boolean)
      .join(" ");

  const balance = Number(account.balance);

  /*
   * Loan calculation:
   * Simple Interest = Principal × Interest Rate × Time (in years) / 100
   *
   * For loan accounts, `balance` is treated as the amount already paid.
   * Remaining amount = Principal + Total Interest - Amount Paid.
   */
  const loanPrincipal = Number(account.loanDetails?.principalAmount ?? 0);
  const loanInterestRate = Number(account.loanDetails?.interestRate ?? 0);
  const loanTermYears = Number(account.loanDetails?.termMonths ?? 0) / 12;

  const totalLoanInterest =
    (loanPrincipal * loanInterestRate * loanTermYears) / 100;

  const totalLoanPayable = loanPrincipal + totalLoanInterest;

  const remainingPrincipal = account.loanDetails
    ? Math.max(0, totalLoanPayable - balance)
    : 0;

  return (
    <div className="max-w-6xl -mt-10 mx-auto py-8 px-4 space-y-6">
      <div className="bg-brand-card border border-brand-border p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-brand-accent bg-brand-surface-subtle px-2.5 py-0.5 rounded-full border border-brand-accent/20">
              {account.type} Account
            </span>

            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                account.accountStatus === "OPEN"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : account.accountStatus === "FROZEN"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              ● {account.accountStatus}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-brand-text">
            {fullName}
          </h1>

          <p className="text-xs text-brand-muted font-mono mt-0.5">
            Account No:{" "}
            <span className="text-brand-text font-bold">
              {account.accountNo}
            </span>
          </p>
        </div>

        {/* ACTION BUTTONS */}

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {account.type === "LOAN" ? (
            <button
              type="button"
              onClick={() => setActiveModal("PAY")}
              disabled={account.accountStatus !== "OPEN"}
              className="flex-1 md:flex-none px-4 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pay
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveModal("TRANSFER")}
                disabled={account.accountStatus !== "OPEN"}
                className="flex-1 md:flex-none px-4 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Transfer Money
              </button>

              <button
                type="button"
                onClick={() => setActiveModal("DEPOSIT")}
                disabled={account.accountStatus !== "OPEN"}
                className="flex-1 md:flex-none px-4 py-2 bg-brand-surface-subtle border border-brand-accent/30 text-brand-accent hover:bg-brand-accent/10 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Deposit
              </button>

              <button
                type="button"
                onClick={() => setActiveModal("WITHDRAW")}
                disabled={account.accountStatus !== "OPEN"}
                className="flex-1 md:flex-none px-4 py-2 bg-brand-bg border border-brand-border text-brand-text hover:bg-brand-border/40 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Withdraw
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          {/* BALANCE / REMAINING PRINCIPAL */}

          <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-xs space-y-2">
            <span className="text-xs text-brand-muted uppercase tracking-wider font-semibold">
              {account.type === "LOAN"
                ? "Remaining Principal"
                : "Available Balance"}
            </span>

            <div className="text-3xl font-black text-brand-text">
              ₹
              {(account.type === "LOAN"
                ? remainingPrincipal
                : balance
              ).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>

            <p className="text-[11px] text-brand-muted">
              Branch ID:{" "}
              <strong className="text-brand-text">
                {account.branch?.branchId || account.branchId}
              </strong>
            </p>
          </div>

          {/* CUSTOMER DETAILS */}

          <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-accent border-b border-brand-border pb-2">
              Customer Details
            </h3>

            <div className="text-xs space-y-2">
              <div>
                <span className="text-brand-muted">Email:</span>

                <strong className="text-brand-text block">
                  {account.accountHolderEmail}
                </strong>
              </div>

              <div>
                <span className="text-brand-muted">Account Opened:</span>

                <strong className="text-brand-text block">
                  {new Date(account.createdAt).toLocaleDateString("en-IN")}
                </strong>
              </div>
            </div>
          </div>

          {/* ADDRESS */}

          <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-accent border-b border-brand-border pb-2">
              Primary Address
            </h3>

            {account.accountHolderAddress ? (
              <div className="text-xs space-y-1 text-brand-text">
                <p>{account.accountHolderAddress.addressLine1}</p>

                {account.accountHolderAddress.addressLine2 && (
                  <p>{account.accountHolderAddress.addressLine2}</p>
                )}

                <p>
                  {account.accountHolderAddress.city},{" "}
                  {account.accountHolderAddress.pincode}
                </p>

                <p className="font-semibold text-brand-muted">
                  {account.accountHolderAddress.country}
                </p>
              </div>
            ) : (
              <p className="text-xs text-brand-muted">
                No address information available.
              </p>
            )}
          </div>

          {/* BUSINESS DETAILS */}

          {account.businessDetails && (
            <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-accent border-b border-brand-border pb-2">
                Business Details
              </h3>

              <div className="text-xs space-y-2">
                <div>
                  <span className="text-brand-muted">Company Name:</span>

                  <strong className="text-brand-text block">
                    {account.businessDetails.companyName}
                  </strong>
                </div>

                <div>
                  <span className="text-brand-muted">Tax ID:</span>

                  <strong className="text-brand-text block">
                    {account.businessDetails.taxId}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* LOAN DETAILS */}

          {account.loanDetails && (
            <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-accent border-b border-brand-border pb-2">
                Loan Terms
              </h3>

              <div className="text-xs space-y-2">
                <div>
                  <span className="text-brand-muted">Principal Amount:</span>

                  <strong className="text-brand-text block">
                    ₹
                    {Number(account.loanDetails.principalAmount).toLocaleString(
                      "en-IN",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </strong>
                </div>

                <div>
                  <span className="text-brand-muted">Interest Rate:</span>

                  <strong className="text-brand-text block">
                    {Number(account.loanDetails.interestRate)}%
                  </strong>
                </div>

                <div>
                  <span className="text-brand-muted">
                    Total Interest (Simple Interest):
                  </span>

                  <strong className="text-brand-text block">
                    ₹
                    {totalLoanInterest.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </div>

                <div>
                  <span className="text-brand-muted">Total Payable:</span>

                  <strong className="text-brand-text block">
                    ₹
                    {totalLoanPayable.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </div>

                <div>
                  <span className="text-brand-muted">Amount Paid:</span>

                  <strong className="text-brand-text block">
                    ₹
                    {balance.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </div>

                <div>
                  <span className="text-brand-muted">Term Duration:</span>

                  <strong className="text-brand-text block">
                    {account.loanDetails.termMonths} Months
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================
            RIGHT PANEL
        =================================================== */}

        <div className="md:col-span-2 bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            {/* TRANSACTION HEADER */}

            <div className="flex justify-between items-center border-b border-brand-border pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-brand-text">
                  Recent Transactions
                </h3>

                <p className="text-xs text-brand-muted">
                  Audit history ({totalRecords} records found)
                </p>
              </div>

              <span className="text-xs text-brand-muted font-medium">
                Page {page} of {totalPages}
              </span>
            </div>

            {/* FILTERS */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3 bg-brand-bg rounded-xl border border-brand-border text-xs">
              {/* TYPE */}

              <div>
                <label className="block text-[11px] font-semibold text-brand-muted mb-1">
                  Type
                </label>

                <select
                  value={transactionType}
                  onChange={(e) =>
                    handleTypeChange(e.target.value as TransactionType | "")
                  }
                  className="w-full bg-brand-card border border-brand-border rounded-lg p-2 text-brand-text font-medium focus:outline-none focus:border-brand-accent"
                >
                  <option value="">All Types</option>

                  <option value="TRANSFER">Transfer</option>

                  <option value="DEPOSIT">Deposit</option>

                  <option value="WITHDRAWAL">Withdrawal</option>
                </select>
              </div>

              {/* START DATE */}

              <div>
                <label className="block text-[11px] font-semibold text-brand-muted mb-1">
                  From Date
                </label>

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full bg-brand-card border border-brand-border rounded-lg p-1.5 text-brand-text focus:outline-none focus:border-brand-accent"
                />
              </div>

              {/* END DATE */}

              <div>
                <label className="block text-[11px] font-semibold text-brand-muted mb-1">
                  To Date
                </label>

                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full bg-brand-card border border-brand-border rounded-lg p-1.5 text-brand-text focus:outline-none focus:border-brand-accent"
                />
              </div>

              {/* CLEAR */}

              {(transactionType || startDate || endDate) && (
                <div className="sm:col-span-3 flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-[11px] font-medium text-brand-accent hover:underline cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>

            {/* =================================================
                TRANSACTION LIST
            ================================================= */}

            <div className="divide-y divide-brand-border">
              {isTxLoading ? (
                <div className="py-12 text-center text-xs text-brand-muted">
                  Updating transactions...
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-12 text-center text-xs text-brand-muted">
                  No transaction records found matching your query.
                </div>
              ) : (
                transactions.map((tx) => {
                  /*
                   * Current account:
                   *
                   * accountNo = ACC7684112063
                   */

                  const currentAccountNo = accountNo?.toLowerCase();

                  const senderAccountNo =
                    tx.senderAccount?.accountNo?.toLowerCase();

                  const receiverAccountNo =
                    tx.receiverAccount?.accountNo?.toLowerCase();

                  /*
                   * Incoming transfer
                   */

                  const isIncoming = receiverAccountNo === currentAccountNo;

                  /*
                   * Outgoing transfer
                   */

                  const isOutgoing = senderAccountNo === currentAccountNo;

                  /*
                   * Deposits are credits.
                   */

                  const isCredit =
                    tx.transactionType === "DEPOSIT" || isIncoming;

                  const amount = Number(tx.amount);

                  return (
                    <div
                      key={tx.id}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      {/* LEFT SIDE */}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              tx.transactionType === "DEPOSIT"
                                ? "bg-emerald-100 text-emerald-800"
                                : tx.transactionType === "WITHDRAWAL"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {tx.transactionType}
                          </span>

                          <span className="text-xs font-mono text-brand-muted">
                            {new Date(tx.createdAt).toLocaleDateString("en-IN")}
                          </span>
                        </div>

                        <p className="text-xs text-brand-muted mt-1 truncate">
                          {tx.senderAccount && (
                            <span>From: {tx.senderAccount.accountNo} </span>
                          )}

                          {tx.receiverAccount && (
                            <span>To: {tx.receiverAccount.accountNo}</span>
                          )}

                          {!tx.senderAccount && !tx.receiverAccount && (
                            <span>Ref ID: {tx.id}</span>
                          )}
                        </p>
                      </div>

                      {/* RIGHT SIDE */}

                      <div
                        className={`text-sm font-bold font-mono whitespace-nowrap ${
                          isCredit ? "text-emerald-600" : "text-brand-text"
                        }`}
                      >
                        {isCredit ? "+" : "-"}₹
                        {amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          <div className="flex items-center justify-between pt-4 border-t border-brand-border">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isTxLoading}
              className="px-4 py-1.5 border border-brand-border text-xs rounded-lg text-brand-text hover:bg-brand-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium cursor-pointer"
            >
              ← Previous
            </button>

            <span className="text-xs text-brand-muted font-medium">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isTxLoading}
              className="px-4 py-1.5 border border-brand-border text-xs rounded-lg text-brand-text hover:bg-brand-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="bg-brand-card border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            {/* =================================================
                TRANSFER MODAL
            ================================================= */}

            {activeModal === "TRANSFER" && (
              <form onSubmit={handleTransferSubmit} className="space-y-4">
                <div className="flex justify-between items-center border-b border-brand-border pb-3">
                  <h3 className="text-base font-bold text-brand-text">
                    Transfer Money
                  </h3>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-brand-muted hover:text-brand-text text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {/* ACCOUNT NUMBER */}

                  <div>
                    <label className="block text-brand-text font-medium mb-1">
                      Recipient Account Number *
                    </label>

                    <input
                      type="text"
                      required
                      placeholder="e.g. ACC-1029384"
                      value={transferForm.receiverAccountNo}
                      onChange={(e) =>
                        setTransferForm((prev) => ({
                          ...prev,
                          receiverAccountNo: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                    />
                  </div>

                  {/* IFSC */}

                  <div>
                    <label className="block text-brand-text font-medium mb-1">
                      IFSC Code *
                    </label>

                    <input
                      type="text"
                      required
                      placeholder="e.g. SBIN0001024"
                      value={transferForm.ifscCode}
                      onChange={(e) =>
                        setTransferForm((prev) => ({
                          ...prev,
                          ifscCode: e.target.value.toUpperCase(),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm uppercase focus:outline-none focus:border-brand-accent"
                    />
                  </div>

                  {/* NAME */}

                  <div>
                    <label className="block text-brand-text font-medium mb-1">
                      Recipient Name *
                    </label>

                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Doe"
                      value={transferForm.receiverName}
                      onChange={(e) =>
                        setTransferForm((prev) => ({
                          ...prev,
                          receiverName: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                    />
                  </div>

                  {/* AMOUNT */}

                  <div>
                    <label className="block text-brand-text font-medium mb-1">
                      Amount (₹) *
                    </label>

                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      placeholder="e.g. 5000"
                      value={transferForm.amount}
                      onChange={(e) =>
                        setTransferForm((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                    />
                  </div>
                </div>

                {/* BUTTONS */}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isActionSubmitting}
                    className="flex-1 py-2 border border-brand-border rounded-xl text-xs font-semibold text-brand-muted hover:bg-brand-surface-subtle cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isActionSubmitting}
                    className="flex-1 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {isActionSubmitting ? "Processing..." : "Confirm Transfer"}
                  </button>
                </div>
              </form>
            )}

            {/* =================================================
                DEPOSIT MODAL
            ================================================= */}

            {activeModal === "DEPOSIT" && (
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div className="flex justify-between items-center border-b border-brand-border pb-3">
                  <h3 className="text-base font-bold text-brand-text">
                    Deposit Funds
                  </h3>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-brand-muted hover:text-brand-text text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs space-y-3">
                  <div>
                    <label className="block text-brand-text font-medium mb-1">
                      Deposit Amount (₹) *
                    </label>

                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      placeholder="e.g. 2000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isActionSubmitting}
                    className="flex-1 py-2 border border-brand-border rounded-xl text-xs font-semibold text-brand-muted hover:bg-brand-surface-subtle cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isActionSubmitting}
                    className="flex-1 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {isActionSubmitting ? "Processing..." : "Deposit Funds"}
                  </button>
                </div>
              </form>
            )}

            {/* =================================================
                WITHDRAW MODAL
            ================================================= */}

            {/* =================================================
                PAY LOAN MODAL
            ================================================= */}

            {activeModal === "PAY" && (
              <form onSubmit={(e) => handlePaySubmit(e)} className="space-y-4">
                <div className="flex justify-between items-center border-b border-brand-border pb-3">
                  <h3 className="text-base font-bold text-brand-text">
                    Pay Loan
                  </h3>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-brand-muted hover:text-brand-text text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs space-y-3">
                  <div>
                    <label className="block text-brand-text font-medium mb-1">
                      Payment Amount (₹) *
                    </label>

                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      placeholder="e.g. 5000"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2 border border-brand-border rounded-xl text-xs font-semibold text-brand-muted hover:bg-brand-surface-subtle cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Pay
                  </button>
                </div>
              </form>
            )}
            {activeModal === "WITHDRAW" && (
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div className="flex justify-between items-center border-b border-brand-border pb-3">
                  <h3 className="text-base font-bold text-brand-text">
                    Withdraw Funds
                  </h3>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-brand-muted hover:text-brand-text text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs space-y-3">
                  <div>
                    <label className="block text-brand-text font-medium mb-1">
                      Withdrawal Amount (₹) *
                    </label>

                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      placeholder="e.g. 1000"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm focus:outline-none focus:border-brand-accent"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isActionSubmitting}
                    className="flex-1 py-2 border border-brand-border rounded-xl text-xs font-semibold text-brand-muted hover:bg-brand-surface-subtle cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isActionSubmitting}
                    className="flex-1 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {isActionSubmitting ? "Processing..." : "Withdraw Funds"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
