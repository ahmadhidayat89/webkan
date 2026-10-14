import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import {
    LayoutDashboard,
    BookOpen,
    PenTool,
    User,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Users,
    Shield,
    Activity,
    Award,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function Navbar({ role }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const profileRef = useRef(null);
    const isAdmin = role === 'admin';

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navLinks = [
        { name: 'Dashboard', href: route('dashboard'), icon: LayoutDashboard, active: route().current('dashboard') },
        { name: 'Course', href: route('courses.list'), icon: BookOpen, active: route().current('courses.list') },
    ];

    if (isAdmin) {
        navLinks.push(
            {
                name: 'Studio Konten',
                href: route('admin.courses.index'),
                icon: PenTool,
                active: route().current('admin.courses.*'),
            },
            {
                name: 'Kelola User',
                href: route('admin.users.index'),
                icon: Users,
                active: route().current('admin.users.index'),
            },
            {
                name: 'Log Aktivitas',
                href: route('admin.audit-logs.index'),
                icon: Activity,
                active: route().current('admin.audit-logs.*'),
            }
        );
    }

    const roleBadge = isAdmin
        ? { label: 'Admin', color: 'bg-gold-100 text-gold-700 border-gold-200' }
        : { label: 'Peserta', color: 'bg-navy-50 text-navy-700 border-navy-200' };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled ? 'glass shadow-nav' : 'bg-white border-b border-gray-100'
        }`}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href={route('dashboard')} className="flex-shrink-0">
                        <ApplicationLogo />
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    link.active
                                        ? 'bg-navy-50 text-navy-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <link.icon className="w-4 h-4" />
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Right Side */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Role Badge */}
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleBadge.color}`}>
                            {isAdmin && <Shield className="w-3 h-3" />}
                            {roleBadge.label}
                        </span>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                                aria-label="Menu profil"
                            >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                    isAdmin
                                        ? 'bg-gradient-to-br from-gold-500 to-gold-700'
                                        : 'bg-gradient-to-br from-navy-500 to-navy-700'
                                }`}>
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="text-left hidden lg:block">
                                    <p className="text-xs font-semibold text-gray-800 leading-tight">{user?.name || 'User'}</p>
                                    <p className="text-[10px] text-gray-400 leading-tight">{user?.organization || user?.email}</p>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-scale-in">
                                    <div className="px-4 py-3 border-b border-gray-50">
                                        <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{user?.email || 'user@email.com'}</p>
                                        {user?.organization && (
                                            <p className="text-xs text-gray-400 mt-0.5">🏢 {user.organization}</p>
                                        )}
                                    </div>
                                    <Link
                                        href={route('profile.edit')}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        onClick={() => setProfileOpen(false)}
                                    >
                                        <User className="w-4 h-4 text-gray-400" />
                                        Edit Profil
                                    </Link>
                                    {!isAdmin && (
                                        <Link
                                            href={route('certificates.index')}
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            <Award className="w-4 h-4 text-gray-400" />
                                            Sertifikat Saya
                                        </Link>
                                    )}
                                    {isAdmin && (
                                        <Link
                                            href={route('admin.users.index')}
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            <Users className="w-4 h-4 text-gray-400" />
                                            Kelola User
                                        </Link>
                                    )}
                                    <hr className="my-1 border-gray-100" />
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        onClick={() => setProfileOpen(false)}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Keluar
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                        aria-label="Buka menu"
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white animate-fade-in">
                    {/* Mobile User Info */}
                    <div className="px-4 py-4 border-b border-gray-50 flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-bold ${
                            isAdmin
                                ? 'bg-gradient-to-br from-gold-500 to-gold-700'
                                : 'bg-gradient-to-br from-navy-500 to-navy-700'
                        }`}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                            <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleBadge.color}`}>
                                {isAdmin && <Shield className="w-2.5 h-2.5" />}
                                {roleBadge.label}
                            </span>
                        </div>
                    </div>

                    {/* Mobile Nav Links */}
                    <div className="px-4 py-3 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                                    link.active
                                        ? 'bg-navy-50 text-navy-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <link.icon className="w-5 h-5" />
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="px-4 py-3 border-t border-gray-50 space-y-2">
                        <Link
                            href={route('profile.edit')}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setMobileOpen(false)}
                        >
                            <User className="w-5 h-5 text-gray-400" />
                            Edit Profil
                        </Link>
                        {!isAdmin && (
                            <Link
                                href={route('certificates.index')}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                onClick={() => setMobileOpen(false)}
                            >
                                <Award className="w-5 h-5 text-gray-400" />
                                Sertifikat Saya
                            </Link>
                        )}
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            onClick={() => setMobileOpen(false)}
                        >
                            <LogOut className="w-5 h-5" />
                            Keluar dari Akun
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
