// src/roles/RoleGate.tsx
import { ReactNode } from 'react';
import { UserRole, useRoleAccess } from './permissions';
import { Lock } from 'lucide-react';

interface RoleGateProps {
  role: UserRole;
  requiredPermission?: keyof ReturnType<typeof useRoleAccess>;
  children: ReactNode;
  fallback?: ReactNode;
}

export const RoleGate = ({ 
  role, 
  requiredPermission,
  children, 
  fallback 
}: RoleGateProps) => {
  const perms = useRoleAccess(role);
  
  // Если указана конкретная permission — проверяем её
  if (requiredPermission) {
    const hasAccess = Boolean(perms[requiredPermission]);
    if (!hasAccess) {
      return fallback || (
        <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
          <Lock className="w-8 h-8 text-red-400" />
          <div>
            <p className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest">
              ACCESS DENIED
            </p>
            <p className="text-[8px] text-slate-500 uppercase mt-2 tracking-widest">
              Insufficient Clearance Level
            </p>
          </div>
        </div>
      );
    }
  }
  
  return <>{children}</>;
};
