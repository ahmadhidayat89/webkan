import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, Video, ClipboardCheck, X } from 'lucide-react';

const eventTypeConfig = {
    deadline: { icon: Clock, label: 'Deadline', color: 'text-red-500', bg: 'bg-red-50', dot: 'bg-red-500' },
    live_session: { icon: Video, label: 'Live Session', color: 'text-blue-500', bg: 'bg-blue-50', dot: 'bg-blue-500' },
    assessment: { icon: ClipboardCheck, label: 'Assessment', color: 'text-purple-500', bg: 'bg-purple-50', dot: 'bg-purple-500' },
};

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const DAY_HEADERS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

export default function EventCalendar({ events = [] }) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState(null);
    const [slideDirection, setSlideDirection] = useState('');

    // Group events by date string
    const eventsByDate = useMemo(() => {
        const map = {};
        events.forEach((event) => {
            const dateKey = event.date || new Date(event.start_datetime).toISOString().split('T')[0];
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(event);
        });
        return map;
    }, [events]);

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const prevMonth = () => {
        setSlideDirection('slide-right');
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
        setSelectedDate(null);
        setTimeout(() => setSlideDirection(''), 300);
    };

    const nextMonth = () => {
        setSlideDirection('slide-left');
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
        setSelectedDate(null);
        setTimeout(() => setSlideDirection(''), 300);
    };

    const goToToday = () => {
        setSlideDirection('');
        setCurrentMonth(today.getMonth());
        setCurrentYear(today.getFullYear());
        setSelectedDate(null);
    };

    // Get events for selected date
    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
        return eventsByDate[dateKey] || [];
    }, [selectedDate, currentMonth, currentYear, eventsByDate]);

    // Build calendar grid
    const calendarDays = [];
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
    }
    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = eventsByDate[dateKey] || [];
        const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
        const isSelected = day === selectedDate;

        calendarDays.push({ day, dateKey, dayEvents, isToday, isSelected });
    }

    return (
        <div className="card overflow-hidden">
            {/* Calendar Header */}
            <div className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">
                            {MONTH_NAMES[currentMonth]} {currentYear}
                        </h3>
                        <button
                            onClick={goToToday}
                            className="text-[10px] font-medium text-navy-600 hover:text-navy-800 transition-colors mt-0.5"
                        >
                            Hari Ini
                        </button>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={prevMonth}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={nextMonth}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-0 mb-1">
                    {DAY_HEADERS.map((d) => (
                        <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-1">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className={`grid grid-cols-7 gap-0 transition-all duration-300 ${
                    slideDirection === 'slide-left' ? 'animate-slide-in-right' :
                    slideDirection === 'slide-right' ? 'animate-slide-in-left' : ''
                }`}>
                    {calendarDays.map((cell, index) => {
                        if (!cell) {
                            return <div key={`empty-${index}`} className="p-1" />;
                        }

                        const { day, dayEvents, isToday, isSelected } = cell;
                        const hasEvents = dayEvents.length > 0;

                        // Get unique event types for dot indicators
                        const eventTypes = [...new Set(dayEvents.map((e) => e.event_type))];

                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDate(isSelected ? null : day)}
                                className={`relative flex flex-col items-center justify-center p-1 rounded-lg transition-all duration-200 min-h-[40px] ${
                                    isSelected
                                        ? 'bg-navy-600 text-white shadow-md scale-105'
                                        : isToday
                                            ? 'bg-navy-50 text-navy-700 font-bold'
                                            : hasEvents
                                                ? 'hover:bg-gray-50 text-gray-700'
                                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                <span className={`text-xs ${isToday && !isSelected ? 'font-bold' : 'font-medium'}`}>
                                    {day}
                                </span>

                                {/* Event dot indicators */}
                                {hasEvents && (
                                    <div className="flex gap-0.5 mt-0.5">
                                        {eventTypes.slice(0, 3).map((type) => {
                                            const config = eventTypeConfig[type];
                                            return (
                                                <div
                                                    key={type}
                                                    className={`w-1 h-1 rounded-full ${
                                                        isSelected ? 'bg-white/80' : config?.dot || 'bg-gray-400'
                                                    }`}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Event Legend */}
            <div className="px-5 pb-3 flex gap-3">
                {Object.entries(eventTypeConfig).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        <span className="text-[9px] text-gray-400">{config.label}</span>
                    </div>
                ))}
            </div>

            {/* Selected Date Events */}
            {selectedDate && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-gray-700">
                            {selectedDate} {MONTH_NAMES[currentMonth]}
                        </h4>
                        <button
                            onClick={() => setSelectedDate(null)}
                            className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>

                    {selectedDateEvents.length > 0 ? (
                        <div className="space-y-2">
                            {selectedDateEvents.map((event) => {
                                const config = eventTypeConfig[event.event_type] || eventTypeConfig.deadline;
                                const Icon = config.icon;
                                const time = new Date(event.start_datetime);
                                const hours = time.getHours().toString().padStart(2, '0');
                                const minutes = time.getMinutes().toString().padStart(2, '0');

                                return (
                                    <div
                                        key={event.id}
                                        className={`flex items-start gap-2.5 p-2.5 rounded-lg bg-white border ${config.bg}/50 border-gray-100`}
                                    >
                                        <div className={`w-7 h-7 rounded-md ${config.bg} flex items-center justify-center flex-shrink-0`}>
                                            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className={`text-[9px] font-bold uppercase tracking-wider ${config.color}`}>
                                                    {config.label}
                                                </span>
                                                <span className="text-[9px] text-gray-400">{hours}:{minutes}</span>
                                            </div>
                                            <p className="text-xs font-semibold text-gray-800 truncate">{event.title}</p>
                                            <p className="text-[10px] text-gray-500 truncate">{event.course_title}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 text-center py-3">Tidak ada event pada tanggal ini</p>
                    )}
                </div>
            )}
        </div>
    );
}
