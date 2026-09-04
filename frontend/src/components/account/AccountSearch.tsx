import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router"; // Use `next/navigation` (useRouter) if using Next.js App Router
import { Search, Loader2, CreditCard, ArrowRight, User } from "lucide-react";
import { api } from "../../lib/api";

interface AccountResult {
  accountNo: string;
  accountHolderName: string;
  type: string;
  createdAt: string;
}

export default function AccountsSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<AccountResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmedQuery = searchTerm.trim();

    if (!trimmedQuery) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Cancel ongoing requests on rapid typing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const handler = setTimeout(async () => {
      try {
        const response = await api.get("/account/search", {
          params: {
            q: trimmedQuery,
          },
          signal: abortControllerRef.current?.signal,
        });

        setResults(response.data?.data || []);
        setHasSearched(true);
      } catch (err: any) {
        // setError("Error occured while fetching accounts");
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const handleSelectAccount = (accountNo: string) => {
    navigate(`/account/${accountNo}`);
  };

  // Inside AccountsSearchPage.tsx
  useEffect(() => {
    console.log("🟢 AccountsSearchPage mounted successfully!");
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-bold text-brand-text tracking-tight sm:text-3xl">
            Account Lookup
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Search for an account by entering the account number below.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-muted">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Account No. (e.g., ACC102934)"
            className="w-full pl-11 pr-10 py-3 bg-brand-card text-brand-text placeholder:text-brand-muted border border-brand-border rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all text-sm font-medium"
          />
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-accent">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Results Container */}
        <div className="space-y-3">
          {results.length > 0 && (
            <p className="text-xs font-semibold tracking-wider text-brand-muted uppercase px-1">
              Search Results ({results.length})
            </p>
          )}

          {results.map((account) => (
            <button
              key={account.accountNo}
              onClick={() => handleSelectAccount(account.accountNo)}
              className="w-full text-left bg-brand-card hover:bg-brand-surface-subtle border border-brand-accent hover:border-brand-accent rounded-xl p-4 transition-all duration-150 shadow-xs flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-brand-bg text-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-colors">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-brand-text text-base">
                      {account.accountNo}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-bg text-brand-muted uppercase border border-brand-border">
                      {account.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 mt-0.5 text-xs text-brand-muted">
                    <User className="w-3.5 h-3.5" />
                    <span>{account.accountHolderName || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="text-brand-muted group-hover:text-brand-accent group-hover:translate-x-0.5 transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          ))}

          {/* Empty State */}
          {hasSearched && !isLoading && results.length === 0 && (
            <div className="text-center py-12 bg-brand-card rounded-xl border border-brand-border p-6">
              <CreditCard className="w-10 h-10 text-brand-muted mx-auto mb-3 opacity-40" />
              <h3 className="text-sm font-semibold text-brand-text">
                No accounts found
              </h3>
              <p className="text-xs text-brand-muted mt-1">
                No record matches the account number standard starting with "
                {searchTerm}".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
