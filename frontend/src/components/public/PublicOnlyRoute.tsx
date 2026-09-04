import { Navigate, Outlet } from "react-router";
import { useStaffAuthStore } from "../../hooks/useStaffAuthStore";
import { LoadingPage } from "../loading/LoadingPage";

export function PublicOnlyRoute() {
  const isAuthenticated = useStaffAuthStore((state) => state.isAuthenticated);
  const isCheckingAuth = useStaffAuthStore((state) => state.isCheckingAuth);

  if (isCheckingAuth) {
    return <LoadingPage />;
  }

  if (isAuthenticated) {
    return <Navigate to="/account" replace></Navigate>;
  }

  return <Outlet />;
}
