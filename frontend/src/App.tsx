import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { PublicOnlyRoute } from "./components/public/PublicOnlyRoute";

import ProtectedRoute from "./components/private/ProtectedRoute";
import { Toaster } from "sonner";
import { useEffect } from "react";

import { useStaffAuthStore } from "./hooks/useStaffAuthStore";
import StaffLoginPage from "./components/login/LoginPage";
import DashboardPage from "./components/dashboard/page";
import AppLayout from "./components/layout/AppLayout";
import OpenAccountPage from "./components/open-account/OpenAccountPage";
import AccountDetailsPage from "./components/account/AccountPage";
import TransactionsPage from "./components/transaction/TransactionsPage";
import AccountsSearchPage from "./components/account/AccountSearch";

export function App() {
  const checkAuth = useStaffAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: "#0f172a",
            border: "1px solid rgba(30, 41, 59, 0.4)",
            color: "#f8fafc",
            fontSize: "12px",
            borderRadius: "4px",
          },
        }}
      />

      <Routes>
        {/* PUBLIC-ONLY ROUTES (Blocked if user is authenticated) */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<StaffLoginPage />} />
        </Route>

        {/* PROTECTED ROUTES WITH UNIVERSAL LAYOUT */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/open-account"
              element={<OpenAccountPage></OpenAccountPage>}
            ></Route>
            <Route
              path="/account"
              element={<AccountsSearchPage></AccountsSearchPage>}
            ></Route>
            <Route
              path="/account/:accountNo"
              element={<AccountDetailsPage></AccountDetailsPage>}
            ></Route>

            <Route
              path="/transactions"
              element={<TransactionsPage></TransactionsPage>}
            ></Route>
            {/* Add any other protected routes here (e.g., /accounts, /transactions) */}
          </Route>
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
