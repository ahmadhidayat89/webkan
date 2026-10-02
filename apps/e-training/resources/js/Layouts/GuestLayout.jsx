import ApplicationLogo from '@/Components/ApplicationLogo';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function GuestLayout({ children, backHref }) {
    return (
        <div className="min-h-screen flex">
            {/* Left Branding Panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-800 via-navy-700 to-navy-900 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-navy-600/30 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/5 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/5 rounded-full" />
                    {/* Grid pattern */}
                    <div className="absolute inset-0 opacity-5" style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '30px 30px'
                    }} />

                    {/* Sketch Illustration Background */}
                    <div className="absolute bottom-0 right-0 w-full h-full flex items-end justify-center opacity-80 mix-blend-screen pointer-events-none">
                        <img
                            src="/images/training_sketch.png"
                            alt="Training Illustration Background"
                            className="w-full max-w-2xl h-auto object-contain object-bottom translate-y-12"
                        />
                    </div>
                </div>

                <div className="relative z-10 flex flex-col justify-start pt-10 px-16 h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                            <BookOpen className="w-7 h-7 text-gold-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">E-Training</h1>
                            <p className="text-gold-400 text-sm font-semibold tracking-widest">KAN</p>
                        </div>
                    </div>

                    <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                        Platform Pelatihan<br />
                        <span className="text-gold-400">Komite Akreditasi Nasional</span>
                    </h2>
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
                {/* Mobile Logo */}
                <div className="lg:hidden mb-8">
                    <ApplicationLogo className="justify-center" />
                </div>

                <div className="w-full max-w-md">
                    {backHref && (
                        <nav aria-label="Navigasi kembali" className="mb-5">
                            <a
                                href={backHref}
                                className="group inline-flex min-h-11 items-center gap-2 rounded text-sm font-medium text-gray-500 transition-colors hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-4"
                            >
                                <ArrowLeft className="h-4 w-4 shrink-0 motion-safe:transition-transform motion-safe:group-hover:-translate-x-0.5" aria-hidden="true" />
                                Kembali ke Beranda KAN
                            </a>
                        </nav>
                    )}

                    <div className="bg-white rounded-2xl shadow-card border border-gray-100 px-8 py-10">
                        {children}
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        © 2026 Komite Akreditasi Nasional. Semua hak dilindungi.
                    </p>
                </div>
            </div>
        </div>
    );
}
