import { Navigate, Outlet } from "react-router-dom";
import { useSocratixStore } from "../data/SocratixStoreProvider";

export default function ProtectedRoute() {
  const { isAuthenticated } = useSocratixStore();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
