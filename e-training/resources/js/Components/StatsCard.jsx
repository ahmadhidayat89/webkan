export default function StatsCard({ icon: Icon, label, value, subtitle, gradient = 'from-navy-500 to-navy-700', index = 0 }) {
    return (
        <div
            className="card p-5 animate-fade-in-up relative overflow-hidden group"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Background decoration */}
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${gradient} opacity-5 rounded-full -translate-y-6 translate-x-6 group-hover:scale-150 transition-transform duration-500`} />

            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                    )}
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
        </div>
    );
}
