import { createContext, useContext } from 'react';
import { usePage } from '@inertiajs/react';

const RoleContext = createContext({
    role: 'pelajar',
});

export const useRole = () => useContext(RoleContext);
export const RoleProvider = RoleContext.Provider;
export default RoleContext;

/**
 * Hook untuk mendapatkan role user yang sedang login.
 * Membaca langsung dari auth.user.role (Inertia shared props).
 */
export function useUserRole() {
    const { auth } = usePage().props;
    return auth?.user?.role ?? 'pelajar';
}
