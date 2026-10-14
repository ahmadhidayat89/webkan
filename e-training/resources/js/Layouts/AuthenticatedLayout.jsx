import Navbar from '@/Components/Navbar';
import { usePage } from '@inertiajs/react';
import { RoleProvider } from '@/contexts/RoleContext';

export default function AuthenticatedLayout({ header, children }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role ?? 'peserta';

    return (
        <RoleProvider value={{ role }}>
            <div className="min-h-screen bg-kan-bg">
                <Navbar role={role} />

                {/* Spacer for fixed navbar */}
                <div className="h-16" />

                {header && (
                    <header className="bg-white border-b border-gray-100">
                        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                <main>{children}</main>
            </div>
        </RoleProvider>
    );
}
