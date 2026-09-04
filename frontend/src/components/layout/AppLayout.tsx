import { NavLink, Outlet, useNavigate } from "react-router";
import { useStaffAuthStore } from "../../hooks/useStaffAuthStore";
import { Logo } from "../logo/Logo";
import { LogOut } from "lucide-react"; // Optional: Icon for the button
import { api } from "../../lib/api";

export default function AppLayout() {
  const staff = useStaffAuthStore((state) => state.staff);
  const clearAuth = useStaffAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/staff/auth/logout");
      clearAuth();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text font-sans">
      {/* Top Header Navigation */}
      <header className="bg-brand-card border-b border-brand-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Logo & Main Navigation */}
          <div className="flex items-center gap-8">
            <Logo size={32}></Logo>

            <nav className="flex items-center gap-1 sm:gap-2">
              <NavLink
                to="/open-account"
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                    isActive
                      ? "text-brand-accent underline underline-offset-8 decoration-2 font-bold"
                      : "text-brand-muted hover:text-brand-text hover:bg-brand-surface-subtle"
                  }`
                }
              >
                Open Account
              </NavLink>

              <NavLink
                to="/account"
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                    isActive
                      ? "text-brand-accent underline underline-offset-8 decoration-2 font-bold"
                      : "text-brand-muted hover:text-brand-text hover:bg-brand-surface-subtle"
                  }`
                }
              >
                Accounts
              </NavLink>

              <NavLink
                to="/transactions"
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                    isActive
                      ? "text-brand-accent underline underline-offset-8 decoration-2 font-bold"
                      : "text-brand-muted hover:text-brand-text hover:bg-brand-surface-subtle"
                  }`
                }
              >
                Transactions
              </NavLink>
            </nav>
          </div>

          {/* User Profile / Info Display & Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-sm font-medium text-brand-text">
                  {staff?.lastName}, {staff?.firstName}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-brand-surface-subtle border border-brand-accent/30 flex items-center justify-center text-xs font-bold text-brand-accent uppercase">
                {staff?.firstName?.[0]}
                {staff?.lastName?.[0]}
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="h-5 w-[1px] bg-brand-border" />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-2 text-brand-muted hover:text-red-500 hover:bg-brand-surface-subtle rounded-md transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
