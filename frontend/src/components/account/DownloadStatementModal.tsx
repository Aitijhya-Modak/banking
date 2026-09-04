import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "../../lib/api";

export type TimeframeOption = "1m" | "3m" | "6m" | "1y";
export type ExportFormat = "pdf" | "csv";

interface ExportStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountNo: string;
}

interface StatementPayload {
  account: {
    accountNo: string;
    type: string;
    currentBalance: number;
    holderName: string;
    email: string;
  };
  period: {
    timeframe: string;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalTransactions: number;
    totalDeposits: number;
    totalWithdrawals: number;
    netChange: number;
  };
  transactions: Array<{
    id: string;
    date: string;
    type: string;
    direction: "INCOMING" | "OUTGOING";
    counterparty: string;
    amount: number;
  }>;
}

export function ExportStatementModal({
  isOpen,
  onClose,
  accountNo,
}: ExportStatementModalProps) {
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [timeframe, setTimeframe] = useState<TimeframeOption>("1m");
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Helper to generate CSV files
  const downloadCSV = (data: StatementPayload) => {
    const headers = [
      "Transaction ID",
      "Date",
      "Type",
      "Direction",
      "Counterparty",
      "Amount",
    ];
    const rows = data.transactions.map((tx) => [
      tx.id,
      new Date(tx.date).toISOString().replace("T", " ").substring(0, 19),
      tx.type,
      tx.direction,
      tx.counterparty,
      `${tx.direction === "INCOMING" ? "+" : "-"}INR ${tx.amount.toFixed(2)}`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Statement_${accountNo}_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Helper to generate professional PDF files
  const downloadPDF = (data: StatementPayload) => {
    const doc = new jsPDF();

    // Document Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text("ACCOUNT STATEMENT", 14, 20);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

    // Header Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 30, 196, 30);

    // Account & Period Metadata Box
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Account Details", 14, 38);
    doc.text("Statement Period", 110, 38);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.text(`Account Holder: ${data.account.holderName}`, 14, 44);
    doc.text(`Account Number: ${data.account.accountNo}`, 14, 50);
    doc.text(`Account Type: ${data.account.type}`, 14, 56);

    const startFormatted = new Date(data.period.startDate).toLocaleDateString();
    const endFormatted = new Date(data.period.endDate).toLocaleDateString();
    doc.text(`From: ${startFormatted}`, 110, 44);
    doc.text(`To: ${endFormatted}`, 110, 50);
    doc.text(`Timeframe: ${data.period.timeframe.toUpperCase()}`, 110, 56);

    // Financial Summary Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("Summary", 14, 68);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Total Deposits: INR ${data.summary.totalDeposits.toFixed(2)}`,
      14,
      74,
    );
    doc.text(
      `Total Withdrawals: INR ${data.summary.totalWithdrawals.toFixed(2)}`,
      70,
      74,
    );
    doc.text(`Net Change: INR ${data.summary.netChange.toFixed(2)}`, 135, 74);
    doc.text(
      `Current Balance: INR ${data.account.currentBalance.toFixed(2)}`,
      14,
      80,
    );

    // Transactions Table
    const tableData = data.transactions.map((tx) => [
      new Date(tx.date).toLocaleDateString() +
        " " +
        new Date(tx.date).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      tx.type,
      tx.counterparty,
      tx.direction,
      `${tx.direction === "INCOMING" ? "+" : "-"}INR ${tx.amount.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 88,
      head: [["Date", "Type", "Counterparty", "Flow", "Amount"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        4: { fontStyle: "bold", halign: "right" },
      },
    });

    doc.save(`Statement_${accountNo}_${timeframe}.pdf`);
  };

  // 3. Main Export Handler
  const handleExport = async () => {
    try {
      setDownloading(true);
      setError(null);

      const response = await api.get(`/account/audit/${accountNo}/statement`, {
        params: { timeframe },
      });

      const statementData: StatementPayload = response.data.data.result;
      console.log(statementData);
      if (format === "csv") {
        downloadCSV(statementData);
      } else {
        downloadPDF(statementData);
      }

      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to download account statement.",
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-brand-card border border-brand-border/80 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-brand-border/40 pb-4">
          <h2 className="text-lg font-bold font-mono text-brand-text">
            Export Statement
          </h2>
          <button
            onClick={onClose}
            disabled={downloading}
            className="text-brand-muted hover:text-brand-text transition-colors text-xl font-bold"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Target Account Display */}
          <div>
            <label className="block text-xs font-mono uppercase text-brand-muted mb-1 font-semibold">
              Account Number
            </label>
            <input
              type="text"
              value={accountNo}
              disabled
              className="w-full bg-brand-bg/50 border border-brand-border/40 rounded-lg p-2.5 text-sm font-mono text-brand-muted cursor-not-allowed"
            />
          </div>

          {/* Timeframe Selection */}
          <div>
            <label className="block text-xs font-mono uppercase text-brand-muted mb-1 font-semibold">
              Select Timeframe
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "1 Month", value: "1m" },
                { label: "3 Months", value: "3m" },
                { label: "6 Months", value: "6m" },
                { label: "1 Year", value: "1y" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTimeframe(item.value as TimeframeOption)}
                  className={`py-2 rounded-lg text-xs font-mono border transition-all ${
                    timeframe === item.value
                      ? "bg-brand-accent/20 border-brand-accent text-brand-accent font-semibold"
                      : "bg-brand-bg border-brand-border/60 text-brand-muted hover:text-brand-text"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-xs font-mono uppercase text-brand-muted mb-1 font-semibold">
              File Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`p-3 rounded-lg text-xs font-mono border flex items-center justify-center gap-2 transition-all ${
                  format === "pdf"
                    ? "bg-brand-accent/20 border-brand-accent text-brand-accent font-semibold"
                    : "bg-brand-bg border-brand-border/60 text-brand-muted hover:text-brand-text"
                }`}
              >
                <span>PDF Document</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`p-3 rounded-lg text-xs font-mono border flex items-center justify-center gap-2 transition-all ${
                  format === "csv"
                    ? "bg-brand-accent/20 border-brand-accent text-brand-accent font-semibold"
                    : "bg-brand-bg border-brand-border/60 text-brand-muted hover:text-brand-text"
                }`}
              >
                <span>CSV Spreadsheet</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border/40">
          <button
            type="button"
            onClick={onClose}
            disabled={downloading}
            className="px-4 py-2 text-xs font-mono text-brand-muted hover:text-brand-text transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={downloading}
            className="bg-brand-accent hover:bg-brand-accent-hover text-brand-bg font-semibold text-xs px-5 py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {downloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-brand-bg border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              `Download ${format.toUpperCase()}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
