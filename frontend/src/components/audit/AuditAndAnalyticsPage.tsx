import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { api } from "../../lib/api";

export type TransactionType = "TRANSFER" | "DEPOSIT" | "WITHDRAWAL";

export type Transaction = {
  id: string;
  transactionType: TransactionType;
  amount: number;
  senderAccountNo: string;
  receiverAccountNo: string;
  createdAt: string;
};

export type AnalyticsSummary = {
  totalSent: number;
  totalReceived: number;
  netFlow: number;
  totalVolume: number;
};

export default function AccountAuditAnalyticsPage() {
  const { accountNo } = useParams<{ accountNo: string }>();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const pageSize = 20;

  useEffect(() => {
    async function fetchAuditData() {
      if (!accountNo) return;
      try {
        setLoading(true);
        const response = await api.get(`/account/audit/${accountNo}`, {
          params: {
            page: currentPage,
            limit: pageSize,
          },
        });

        const data = response.data.data;
        setTransactions(data.transactions || []);
        setTotalPages(data.totalPages || 1);
        setAnalytics(data.analytics || null);
      } catch (err: any) {
        setError(
          err.response.data.message ||
            "Failed to load audit and analytics data.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAuditData();
  }, [accountNo, currentPage]);

  // Visual Breakdown Helper Computations
  const totalVolume = analytics?.totalVolume || 0;
  const receivedRatio =
    totalVolume > 0 ? ((analytics?.totalReceived || 0) / totalVolume) * 100 : 0;
  const sentRatio =
    totalVolume > 0 ? ((analytics?.totalSent || 0) / totalVolume) * 100 : 0;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/40 pb-6">
          <div>
            <Link
              to="/dashboard"
              className="text-xs font-mono text-brand-muted hover:text-brand-accent transition-colors flex items-center gap-1 mb-2"
            >
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-brand-text">
              Audit & Analytics
            </h1>
            <p className="text-xs font-mono text-brand-muted mt-1">
              Account No:{" "}
              <span className="text-brand-accent font-semibold">
                {accountNo}
              </span>
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Analytics Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wider">
            Financial Insights
          </h2>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-brand-card border border-brand-border rounded-xl p-5 space-y-1">
              <p className="text-xs text-brand-muted font-medium">
                Total Received
              </p>
              <p className="text-2xl font-bold font-mono text-emerald-400">
                +₹{analytics?.totalReceived?.toLocaleString() || "0.00"}
              </p>
            </div>

            <div className="bg-brand-card border border-brand-border rounded-xl p-5 space-y-1">
              <p className="text-xs text-brand-muted font-medium">Total Sent</p>
              <p className="text-2xl font-bold font-mono text-rose-400">
                -₹{analytics?.totalSent?.toLocaleString() || "0.00"}
              </p>
            </div>

            <div className="bg-brand-card border border-brand-border rounded-xl p-5 space-y-1">
              <p className="text-xs text-brand-muted font-medium">
                Net Cash Flow
              </p>
              <p
                className={`text-2xl font-bold font-mono ${(analytics?.netFlow || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}
              >
                {(analytics?.netFlow || 0) >= 0 ? "+" : ""}₹
                {analytics?.netFlow?.toLocaleString() || "0.00"}
              </p>
            </div>

            <div className="bg-brand-card border border-brand-border rounded-xl p-5 space-y-1">
              <p className="text-xs text-brand-muted font-medium">
                Total Volume
              </p>
              <p className="text-2xl font-bold font-mono text-brand-text">
                ₹{analytics?.totalVolume?.toLocaleString() || "0.00"}
              </p>
            </div>
          </div>

          {/* Visual Analytics Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Flow Ratio & Volume Distribution */}
            <div className="bg-brand-card border border-brand-border rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-1">
                  Volume Breakdown
                </h3>
                <p className="text-xs text-brand-muted">
                  Ratio of received incoming funds vs outgoing transfers.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-emerald-400">
                    Received ({receivedRatio.toFixed(1)}%)
                  </span>
                  <span className="text-rose-400">
                    Sent ({sentRatio.toFixed(1)}%)
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-3 bg-brand-surface-subtle/30 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${receivedRatio}%` }}
                    className="bg-emerald-500 transition-all duration-500"
                  />
                  <div
                    style={{ width: `${sentRatio}%` }}
                    className="bg-rose-500 transition-all duration-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] font-mono text-brand-muted pt-2 border-t border-brand-border/30">
                <span>Total Actions</span>
                <span className="text-brand-text font-bold">
                  {transactions.length} shown
                </span>
              </div>
            </div>

            {/* Sparkline Cash Flow Trend */}
            <div className="md:col-span-2 bg-brand-card border border-brand-border rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                    Recent Flow Activity
                  </h3>
                  <p className="text-xs text-brand-muted">
                    Activity amounts for recent page transactions.
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-brand-surface-subtle/20 border border-brand-border/40 px-2 py-0.5 rounded text-brand-muted">
                  Live View
                </span>
              </div>

              {/* Pure SVG Sparkline Chart */}
              <div className="h-28 w-full flex items-end pt-2">
                {transactions.length > 0 ? (
                  <svg
                    className="w-full h-full overflow-visible"
                    viewBox="0 0 500 100"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="flowGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#059669"
                          stopOpacity="0.3"
                        />
                        <stop
                          offset="100%"
                          stopColor="#059669"
                          stopOpacity="0.0"
                        />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const maxAmount = Math.max(
                        ...transactions.map((t) => t.amount),
                        1,
                      );
                      const points = transactions
                        .slice()
                        .reverse()
                        .map((tx, idx) => {
                          const x =
                            (idx / Math.max(transactions.length - 1, 1)) * 500;
                          const y = 90 - (tx.amount / maxAmount) * 75;
                          return `${x},${y}`;
                        })
                        .join(" ");

                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="#059669"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={points}
                          />
                          {transactions
                            .slice()
                            .reverse()
                            .map((tx, idx) => {
                              const x =
                                (idx / Math.max(transactions.length - 1, 1)) *
                                500;
                              const y = 90 - (tx.amount / maxAmount) * 75;
                              const isIncoming =
                                tx.receiverAccountNo === accountNo;
                              return (
                                <circle
                                  key={tx.id || idx}
                                  cx={x}
                                  cy={y}
                                  r="4"
                                  className={
                                    isIncoming
                                      ? "fill-emerald-400"
                                      : "fill-rose-400"
                                  }
                                />
                              );
                            })}
                        </>
                      );
                    })()}
                  </svg>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-mono text-brand-muted">
                    Insufficient data for trendline
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Audit Log Table Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wider">
              Transaction History
            </h2>
            <span className="text-xs text-brand-muted font-mono">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden shadow-lg">
            {loading ? (
              <div className="p-8 text-center text-brand-muted text-sm animate-pulse font-mono">
                Loading audit transactions...
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-brand-muted text-sm">
                No transactions recorded for this account.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-brand-border/60 bg-brand-surface-subtle/20 text-brand-muted uppercase font-mono tracking-wider">
                      <th className="p-4">Type</th>
                      <th className="p-4">Direction</th>
                      <th className="p-4">Counterparty</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/30 font-mono">
                    {transactions.map((tx) => {
                      const isIncoming = tx.receiverAccountNo === accountNo;
                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-brand-surface-subtle/10 transition-colors"
                        >
                          <td className="p-4 font-semibold text-brand-text">
                            {tx.transactionType}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isIncoming
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}
                            >
                              {isIncoming ? "RECEIVED" : "SENT"}
                            </span>
                          </td>
                          <td className="p-4 text-brand-muted">
                            {isIncoming
                              ? tx.senderAccountNo
                              : tx.receiverAccountNo}
                          </td>
                          <td className="p-4 text-brand-muted">
                            {new Date(tx.createdAt).toLocaleString()}
                          </td>
                          <td
                            className={`p-4 text-right font-bold text-sm ${
                              isIncoming ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {isIncoming ? "+" : "-"}₹{tx.amount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="p-4 border-t border-brand-border/40 flex items-center justify-between bg-brand-card">
                <button
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  className="bg-brand-surface-subtle text-brand-accent disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs px-3 py-1.5 rounded transition-all"
                >
                  &larr; Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-xs rounded font-mono ${
                          pageNum === currentPage
                            ? "bg-brand-accent text-brand-bg font-bold"
                            : "text-brand-muted hover:text-brand-text"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ),
                  )}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className="bg-brand-surface-subtle text-brand-accent disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs px-3 py-1.5 rounded transition-all"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
