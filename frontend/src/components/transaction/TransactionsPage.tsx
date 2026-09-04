// Location: src/pages/TransactionsPage.tsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { api } from "../../lib/api";

export type TransactionType = "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";

export interface AccountSummary {
  id: string;
  accountNo: string;
  accountHolderFirstName: string;
  accountHolderLastName: string;
}

export interface Transaction {
  id: string;
  transactionType: TransactionType;
  amount: string | number;
  senderAccount?: AccountSummary | null;
  receiverAccount?: AccountSummary | null;
  createdAt: string;
}

export interface PaginationMeta {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FiltersState {
  accountNo: string;
  senderAccountNo: string;
  receiverAccountNo: string;
  transactionType: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  sortBy: "createdAt" | "amount" | "transactionType";
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
}

// Pre-select default date range (Last 30 Days) to ensure immediate data fetch
const getDefaultStartDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
};

const getDefaultEndDate = () => {
  return new Date().toISOString().split("T")[0];
};

const initialFilters: FiltersState = {
  accountNo: "",
  senderAccountNo: "",
  receiverAccountNo: "",
  transactionType: "", // Empty to fetch all types
  startDate: getDefaultStartDate(),
  endDate: getDefaultEndDate(),
  minAmount: "",
  maxAmount: "",
  sortBy: "createdAt",
  sortOrder: "desc",
  page: 1,
  limit: 10,
};

export default function TransactionsPage() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTransactions = useCallback(
    async (currentFilters: FiltersState) => {
      setIsLoading(true);
      try {
        // Build clean query params object removing empty strings
        const activeParams: Record<string, string | number> = {};
        Object.entries(currentFilters).forEach(([key, value]) => {
          if (value !== "" && value !== null && value !== undefined) {
            activeParams[key] = value;
          }
        });

        // Use native Axios signature with automatic param serialization
        const response = await api.get("/transaction", {
          params: activeParams,
        });

        const resData = response.data;

        if (resData.success) {
          setTransactions(resData.data || []);
          setPagination(resData.pagination || null);
        } else {
          toast.error(resData.message || "Could not retrieve records.");
        }
      } catch (error) {
        const err = error as AxiosError<{ message?: string }>;
        toast.error(
          err.response?.data?.message || "Network error fetching transactions.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchTransactions(filters);
  }, [filters, fetchTransactions]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      limit: Number(e.target.value),
      page: 1,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6 -mt-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-text">Transactions</h1>
          <p className="text-xs text-brand-muted mt-1">
            Audit, filter, and inspect global transaction entries across all
            system accounts.
          </p>
        </div>
        <button
          onClick={handleResetFilters}
          className="self-start md:self-auto px-3.5 py-2 bg-brand-card border border-brand-border hover:bg-brand-border/30 text-brand-text text-xs font-semibold rounded-xl transition-all shadow-xs"
        >
          Reset All Filters
        </button>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-5 shadow-xs space-y-4">
        <span className="text-xs font-extrabold uppercase tracking-wider text-brand-accent block border-b border-brand-border pb-2">
          Filter Criteria
        </span>

        {/* Row 1: Account Number Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-brand-muted mb-1">
              Any Account No. (Sender/Receiver)
            </label>
            <input
              type="text"
              name="accountNo"
              placeholder="e.g. ACC1029384"
              value={filters.accountNo}
              onChange={handleInputChange}
              className="w-full px-3 py-1.5 rounded-lg border border-brand-border bg-brand-bg text-xs font-mono focus:outline-none focus:border-brand-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-brand-muted mb-1">
              Sender Account No.
            </label>
            <input
              type="text"
              name="senderAccountNo"
              placeholder="e.g. ACC8839102"
              value={filters.senderAccountNo}
              onChange={handleInputChange}
              className="w-full px-3 py-1.5 rounded-lg border border-brand-border bg-brand-bg text-xs font-mono focus:outline-none focus:border-brand-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-brand-muted mb-1">
              Receiver Account No.
            </label>
            <input
              type="text"
              name="receiverAccountNo"
              placeholder="e.g. ACC9920192"
              value={filters.receiverAccountNo}
              onChange={handleInputChange}
              className="w-full px-3 py-1.5 rounded-lg border border-brand-border bg-brand-bg text-xs font-mono focus:outline-none focus:border-brand-accent"
            />
          </div>
        </div>

        {/* Row 2: Type, Amounts, and Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-brand-muted mb-1">
              Transaction Type
            </label>
            <select
              name="transactionType"
              value={filters.transactionType}
              onChange={handleInputChange}
              className="w-full px-3 py-1.5 rounded-lg border border-brand-border bg-brand-bg text-xs focus:outline-none focus:border-brand-accent"
            >
              <option value="">All Types</option>
              <option value="DEPOSIT">DEPOSIT</option>
              <option value="WITHDRAWAL">WITHDRAWAL</option>
              <option value="TRANSFER">TRANSFER</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-brand-muted mb-1">
              Min Amount (₹)
            </label>
            <input
              type="number"
              name="minAmount"
              placeholder="0"
              value={filters.minAmount}
              onChange={handleInputChange}
              className="w-full px-3 py-1.5 rounded-lg border border-brand-border bg-brand-bg text-xs focus:outline-none focus:border-brand-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-brand-muted mb-1">
              Max Amount (₹)
            </label>
            <input
              type="number"
              name="maxAmount"
              placeholder="100000"
              value={filters.maxAmount}
              onChange={handleInputChange}
              className="w-full px-3 py-1.5 rounded-lg border border-brand-border bg-brand-bg text-xs focus:outline-none focus:border-brand-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-brand-muted mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleInputChange}
              className="w-full px-3 py-1.5 rounded-lg border border-brand-border bg-brand-bg text-xs focus:outline-none focus:border-brand-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-brand-muted mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleInputChange}
              className="w-full px-3 py-1.5 rounded-lg border border-brand-border bg-brand-bg text-xs focus:outline-none focus:border-brand-accent"
            />
          </div>
        </div>

        {/* Row 3: Sorting Controls */}
        <div className="pt-2 border-t border-brand-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-brand-muted">
              Sort By:
            </span>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleInputChange}
              className="px-2.5 py-1 rounded-lg border border-brand-border bg-brand-bg text-xs font-medium focus:outline-none focus:border-brand-accent"
            >
              <option value="createdAt">Date Created</option>
              <option value="amount">Amount</option>
              <option value="transactionType">Transaction Type</option>
            </select>

            <select
              name="sortOrder"
              value={filters.sortOrder}
              onChange={handleInputChange}
              className="px-2.5 py-1 rounded-lg border border-brand-border bg-brand-bg text-xs font-medium focus:outline-none focus:border-brand-accent"
            >
              <option value="desc">Descending (High to Low / Newest)</option>
              <option value="asc">Ascending (Low to High / Oldest)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brand-muted">
              Rows per page:
            </span>
            <select
              value={filters.limit}
              onChange={handleLimitChange}
              className="px-2 py-1 rounded-lg border border-brand-border bg-brand-bg text-xs font-medium focus:outline-none focus:border-brand-accent"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xs space-y-4">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-brand-muted font-medium animate-pulse">
            Loading master transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 text-center text-xs text-brand-muted">
            No transactions found matching your active filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-[11px] font-extrabold uppercase tracking-wider text-brand-muted">
                  <th className="pb-3 px-2">Type</th>
                  <th className="pb-3 px-2">Amount</th>
                  <th className="pb-3 px-2">Sender Account</th>
                  <th className="pb-3 px-2">Receiver Account</th>
                  <th className="pb-3 px-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-brand-bg/60 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <span
                        className={`inline-block font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                          tx.transactionType === "DEPOSIT"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : tx.transactionType === "WITHDRAWAL"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-sky-100 text-sky-800 border border-sky-200"
                        }`}
                      >
                        {tx.transactionType}
                      </span>
                    </td>

                    <td className="py-3 px-2 font-mono font-bold text-brand-text">
                      ₹
                      {Number(tx.amount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td className="py-3 px-2">
                      {tx.senderAccount ? (
                        <button
                          onClick={() =>
                            navigate(`/account/${tx.senderAccount?.accountNo}`)
                          }
                          className="font-mono font-semibold text-brand-accent hover:underline focus:outline-none cursor-pointer"
                        >
                          {tx.senderAccount.accountNo}
                          <span className="block text-[10px] font-sans text-brand-muted font-normal">
                            {tx.senderAccount.accountHolderFirstName}{" "}
                            {tx.senderAccount.accountHolderLastName}
                          </span>
                        </button>
                      ) : (
                        <span className="text-brand-muted italic">
                          N/A (External/Deposit)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-2">
                      {tx.receiverAccount ? (
                        <button
                          onClick={() =>
                            navigate(
                              `/account/${tx.receiverAccount?.accountNo}`,
                            )
                          }
                          className="font-mono font-semibold text-brand-accent hover:underline focus:outline-none cursor-pointer"
                        >
                          {tx.receiverAccount.accountNo}
                          <span className="block text-[10px] font-sans text-brand-muted font-normal">
                            {tx.receiverAccount.accountHolderFirstName}{" "}
                            {tx.receiverAccount.accountHolderLastName}
                          </span>
                        </button>
                      ) : (
                        <span className="text-brand-muted italic">
                          N/A (External/Withdrawal)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-2 font-mono text-brand-muted">
                      {new Date(tx.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 0 && (
          <div className="pt-4 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-muted">
            <div>
              Showing{" "}
              <span className="font-bold text-brand-text">
                {transactions.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-brand-text">
                {pagination.totalRecords}
              </span>{" "}
              entries
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage || isLoading}
                className="px-3 py-1.5 border border-brand-border rounded-lg text-brand-text hover:bg-brand-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium cursor-pointer"
              >
                ← Previous
              </button>

              <span className="px-2 font-semibold text-brand-text">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage || isLoading}
                className="px-3 py-1.5 border border-brand-border rounded-lg text-brand-text hover:bg-brand-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
