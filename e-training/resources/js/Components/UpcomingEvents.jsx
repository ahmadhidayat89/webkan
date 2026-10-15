import { useState, useMemo, useRef, useEffect } from 'react';
import { Clock, Video, ClipboardCheck, Calendar, ArrowRight, ChevronDown, AlertTriangle } from 'lucide-react';

const eventTypeConfig = {
    deadline: {
        icon: Clock,
        label: 'Deadline',
        color: 'text-red-500',
        bg: 'bg-red-50',
        border: 'border-red-200',
    },
    live_session: {
        icon: Video,
        label: 'Live Session',
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
    },
    assessment: {
        icon: ClipboardCheck,
        label: 'Assessment',
        color: 'text-purple-500',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
    },
};

const FILTERS = [
    { key: 'next7',   label: '7 Hari Mendatang',   days: 7,   direction: 'future' },
    { key: 'next30',  label: '30 Hari Mendatang',  days: 30,  direction: 'future' },
    { key: 'past30',  label: '30 Hari Sebelumnya', days: 30,  direction: 'past'   },
];

const DAY_NAMES   = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatEventDate(dateString) {
    const date   = new Date(dateString);
    const now    = new Date();
    const diffMs = date - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const hours  = date.getHours().toString().padStart(2, '0');
    const mins   = date.getMinutes().toString().padStart(2, '0');
    const label  = `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;

    let relative = '';
    if (diffDays === 0)        relative = 'Hari ini';
    else if (diffDays === 1)   relative = 'Besok';
    else if (diffDays > 1 && diffDays <= 7) relative = `${diffDays} hari lagi`;
    else if (diffDays < 0)     relative = `${Math.abs(diffDays)} hari lalu`;
    else                       relative = label;

    return { formatted: `${label} • ${hours}:${mins}`, relative, isPast: diffMs < 0 };
}

function getRelativeColor(relative, isPast) {
    if (relative === 'Hari ini') return 'text-red-600';
    if (relative === 'Besok') return 'text-orange-500';
    if (isPast) return 'text-red-500';
    return 'text-gray-500';
}

function EventItem({ event, index, isPastView }) {
    const config = eventTypeConfig[event.event_type] ?? eventTypeConfig.deadline;
    const Icon   = config.icon;
    const { formatted, relative, isPast } = formatEventDate(event.start_datetime);
    const overdue = isPast && !event.is_completed;

    // Urgency coloring for upcoming
    const relativeColor = getRelativeColor(relative, isPast);

    const cardColor = overdue
        ? 'border-red-300 bg-red-50/60 hover:bg-red-50'
        : config.border + ' ' + config.bg + '/40 hover:' + config.bg;

    return (
        <div
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer group animate-fade-in ${cardColor}`}
            style={{ animationDelay: `${index * 60}ms` }}
        >
            {/* Icon */}
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform
                ${overdue ? 'bg-red-100' : config.bg}`}>
                {overdue
                    ? <AlertTriangle className="w-4 h-4 text-red-500" />
                    : <Icon className={`w-4 h-4 ${config.color}`} />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Row 1: type + relative time */}
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${overdue ? 'text-red-500' : config.color}`}>
                        {config.label}
                    </span>
                    {relative && (
                        <>
                            <span className="text-gray-300">•</span>
                            <span className={`text-[9px] font-semibold ${relativeColor}`}>{relative}</span>
                        </>
                    )}
                </div>

                {/* Title */}
                <p className="text-xs font-semibold text-gray-800 truncate">{event.title}</p>

                {/* Course */}
                <p className="text-[10px] text-gray-500 truncate mt-0.5">{event.course_title}</p>

                {/* Date/time */}
                <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-2.5 h-2.5 text-gray-400" />
                    <span className="text-[10px] text-gray-400">{formatted}</span>
                </div>
            </div>

            {/* Status badge — right side */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {overdue && (
                    <span className="text-[9px] font-bold text-red-600 bg-red-100 border border-red-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                        Belum Dikerjakan
                    </span>
                )}
                {!overdue && event.is_completed && (
                    <span className="text-[9px] font-bold text-green-600 bg-green-100 border border-green-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                        Selesai
                    </span>
                )}
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all mt-1" />
            </div>
        </div>
    );
}

export default function UpcomingEvents({ events = [] }) {
    const [activeFilter, setActiveFilter] = useState('next30');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const currentFilter = FILTERS.find(f => f.key === activeFilter) ?? FILTERS[0];

    const filtered = useMemo(() => {
        const now = new Date();
        const limitMs = currentFilter.days * 24 * 60 * 60 * 1000;

        const result = events.filter(ev => {
            const evDate = new Date(ev.start_datetime);
            const diffMs = evDate - now;

            if (currentFilter.direction === 'future') {
                // 0 → +N days
                return diffMs >= 0 && diffMs <= limitMs;
            } else {
                // -N days → 0 (past events, not yet completed)
                return diffMs < 0 && Math.abs(diffMs) <= limitMs;
            }
        });

        // Sort: closest deadline first (ascending for future, most-recent-past first for past)
        result.sort((a, b) => {
            const aDate = new Date(a.start_datetime);
            const bDate = new Date(b.start_datetime);
            if (currentFilter.direction === 'future') {
                return aDate - bDate; // soonest first
            } else {
                return bDate - aDate; // most recently passed first
            }
        });

        return result;
    }, [events, activeFilter]);

    return (
        <div className="card p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-navy-500" />
                    <h3 className="text-sm font-bold text-gray-900">Event</h3>
                </div>

                <div className="flex items-center gap-2">
                    {filtered.length > 0 && (
                        <span className="text-[10px] font-medium text-navy-500 bg-navy-50 px-2 py-0.5 rounded-full">
                            {filtered.length} event
                        </span>
                    )}

                    {/* Dropdown */}
                    <div className="relative" ref={dropRef}>
                        <button
                            onClick={() => setDropdownOpen(v => !v)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition-all"
                        >
                            {currentFilter.label}
                            <ChevronDown className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-44 overflow-hidden animate-fade-in">
                                {FILTERS.map(f => (
                                    <button
                                        key={f.key}
                                        onClick={() => { setActiveFilter(f.key); setDropdownOpen(false); }}
                                        className={`w-full text-left px-3.5 py-2.5 text-xs font-medium transition-colors
                                            ${activeFilter === f.key
                                                ? 'bg-navy-50 text-navy-700 font-semibold'
                                                : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {f.key === 'past30' && <span className="mr-1">⏰</span>}
                                        {f.label}
                                        {activeFilter === f.key && <span className="float-right text-navy-500">✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Event List */}
            {filtered.length > 0 ? (
                <div className="space-y-2.5">
                    {filtered.map((event, i) => (
                        <EventItem
                            key={event.id}
                            event={event}
                            index={i}
                            isPastView={currentFilter.direction === 'past'}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-6">
                    <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">
                        {currentFilter.direction === 'past'
                            ? 'Tidak ada event terlewat'
                            : `Tidak ada event dalam ${currentFilter.days} hari ke depan`}
                    </p>
                </div>
            )}
        </div>
    );
}

export { eventTypeConfig, formatEventDate };
