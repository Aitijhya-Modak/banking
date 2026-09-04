import { Navigate, Outlet } from "react-router";
import { useStaffAuthStore } from "../../hooks/useStaffAuthStore";
import { LoadingPage } from "../loading/LoadingPage";

function ProtectedRoute() {
  const isAuthenticated = useStaffAuthStore((state) => state.isAuthenticated);
  const isCheckingAuth = useStaffAuthStore((state) => state.isCheckingAuth);

  if (isCheckingAuth) {
    return <LoadingPage></LoadingPage>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace></Navigate>;
  }

  return <Outlet></Outlet>;
}

export default ProtectedRoute;
