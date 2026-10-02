import { Shield } from 'lucide-react';

export default function ApplicationLogo({ className = '', showText = true }) {
    return (
        <div className={`flex items-center gap-2.5 ${className}`}>
            <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-navy-600 to-navy-800 rounded-lg flex items-center justify-center shadow-md">
                    <Shield className="w-5 h-5 text-gold-400" strokeWidth={2.5} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gold-500 rounded-full border-2 border-white" />
            </div>
            {showText && (
                <div className="flex flex-col leading-none">
                    <span className="text-sm font-bold text-navy-800 tracking-tight">E-Training</span>
                    <span className="text-[10px] font-semibold text-gold-600 tracking-widest uppercase">KAN</span>
                </div>
            )}
        </div>
    );
}
