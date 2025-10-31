import { ReactNode } from "react";
import { useRole } from "@/hooks/useRole";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "слушатель" | "дистрибьютор" | "администратор";
  requireAdmin?: boolean;
  requireContentManagement?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  requireAdmin = false, 
  requireContentManagement = false 
}: ProtectedRouteProps) => {
  const { role, loading, isAdmin, canManageContent } = useRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireContentManagement && !canManageContent) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
