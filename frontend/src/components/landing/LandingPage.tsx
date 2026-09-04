import { Link, useNavigate } from "react-router";
import Logo from "../logo/Logo";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text font-sans selection:bg-brand-accent selection:text-white">
      {/* Navigation Header */}
      <header className="flex justify-between items-center px-6 md:px-16 py-5 border-b border-brand-border bg-brand-card">
        <div className="flex items-center gap-3">
          <Logo size={28} />
        </div>

        <nav className="flex items-center gap-4 text-sm font-semibold">
          <Link
            to="/login"
            className="text-brand-muted hover:text-brand-text transition-colors duration-200 px-3 py-2"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="bg-brand-accent hover:bg-brand-accent-hover text-white px-5 py-2.5 rounded-lg transition-all duration-200 shadow-sm hover:-translate-y-0.5 active:translate-y-0"
          >
            Open account
          </Link>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 sm:p-14 text-center max-w-2xl w-full shadow-sm">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-brand-text mb-6 leading-[1.1]">
            Everyday banking, <br />
            <span className="text-brand-accent font-bold">simplified.</span>
          </h1>

          <p className="text-brand-muted text-base sm:text-lg mb-10 max-w-md mx-auto leading-relaxed font-medium">
            Track balances, send payments instantly, and manage your accounts in
            one clear space.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto text-base font-semibold">
            <button
              onClick={() => navigate("/register")}
              className="bg-brand-accent hover:bg-brand-accent-hover text-white px-6 py-3.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
            >
              Open Account
            </button>
            <button
              onClick={() => navigate("/login")}
              className="bg-brand-card hover:bg-brand-surface-subtle text-brand-accent border border-brand-accent px-6 py-3.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              Log in to view accounts
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-brand-border text-center text-brand-muted text-xs font-mono tracking-wider uppercase bg-brand-card">
        &copy; {new Date().getFullYear()} AMBank. All rights reserved.
      </footer>
    </div>
  );
}
