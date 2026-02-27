import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type UserRole = 'operator' | 'admin';

interface RoleContextType {
    role: UserRole;
    setRole: (role: UserRole) => void;
    isAdmin: boolean;
    isOperator: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [role, setRole] = useState<UserRole>('operator');

    const value = {
        role,
        setRole,
        isAdmin: role === 'admin',
        isOperator: role === 'operator',
    };

    return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = (): RoleContextType => {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
};
