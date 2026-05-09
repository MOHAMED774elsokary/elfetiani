import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  requireCoach?: boolean;
}

export default function ProtectedRoute({ children, requireCoach = false }: Props) {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/portal/login" state={{ from: location }} replace />;
  }

  if (requireCoach && currentUser.role !== 'coach') {
    return <Navigate to="/portal/dashboard" replace />;
  }

  return <>{children}</>;
}
